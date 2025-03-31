import express from "express";
import pool from "../config/postgres.js";
import redisClient from "../config/redis.js";
import { io } from "../server.js";
import { broadcastParkirUpdate } from "../utils/broadcast.js";

const router = express.Router();

router.get("/api/lokasi-parkir", async (req, res) => {
  try {
    const cacheKey = "parkirData";

    // Cek cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Mengambil data dari cache");
      return res.json(JSON.parse(cachedData));
    }

    // Jika tidak ada cache, query DB
    console.log("Mengambil data dari database");
    const result = await pool.query("SELECT * FROM lokasi_parkir");

    // Simpan ke cache (expire 1 menit)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(result.rows));

    res.json(result.rows);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/lapor", async (req, res) => {
  try {
    const { status, lokasiId } = req.body;

    if (!lokasiId || !status) {
      return res.status(400).json({
        error: "Data tidak lengkap",
        required_fields: ["lokasiId", "status"],
      });
    }

    const allowedStatus = ["kosong", "ramai", "penuh"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        error: "Status tidak valid",
        allowed_status: allowedStatus,
      });
    }

    // Validasi lokasi
    const lokasi = await pool.query(
      "SELECT * FROM lokasi_parkir WHERE id = $1",
      [lokasiId]
    );

    if (lokasi.rows.length === 0) {
      return res.status(404).json({
        error: "Lokasi tidak ditemukan",
        available_locations: "/api/lokasi",
      });
    }

    await pool.query("BEGIN");

    const updateResult = await pool.query(
      `UPDATE lokasi_parkir 
         SET status = $1, updated_at = NOW()
         WHERE id = $2 
         RETURNING *`,
      [status, lokasiId]
    );

    await pool.query(
      `INSERT INTO laporan_parkir (lokasi_id, kepadatan) 
         VALUES ($1, $2)`,
      [lokasiId, status]
    );

    await pool.query("COMMIT");

    await broadcastParkirUpdate(io);

    res.json({
      success: true,
      data: updateResult.rows[0],
      message: "Status parkir diperbarui",
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Error laporan parkir:", {
      query: err.query,
      parameters: err.parameters,
      stack: err.stack,
    });

    res.status(500).json({
      error: "Kesalahan sistem laporan",
      detail:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Silakan coba lagi nanti",
    });
  }
});

router.get("/api/lokasi-parkir/filter", async (req, res) => {
  try {
    const {
      status,
      minKapasitas,
      maxKapasitas,
      sortBy = "nama",
      order = "ASC",
    } = req.query;

    const allowedSort = ["nama", "kapasitas", "status"];
    const allowedOrder = ["ASC", "DESC"];

    if (!allowedSort.includes(sortBy))
      throw new Error("Kolom sorting tidak valid");
    if (!allowedOrder.includes(order.toUpperCase()))
      throw new Error("Order tidak valid");

    let whereConditions = [];
    const params = [];

    if (status) {
      whereConditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (minKapasitas) {
      whereConditions.push(`kapasitas >= $${params.length + 1}`);
      params.push(minKapasitas);
    }
    if (maxKapasitas) {
      whereConditions.push(`kapasitas <= $${params.length + 1}`);
      params.push(maxKapasitas);
    }
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const result = await pool.query({
      text: `SELECT * FROM lokasi_parkir 
               ${whereClause} 
               ORDER BY ${sortBy} ${order}`,
      values: params,
    });

    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
export default router;
