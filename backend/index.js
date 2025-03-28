import { createClient } from "redis";
import express from "express";
import pg from "pg";
const { Pool } = pg;
import cors from "cors";
import { exec } from "child_process";
import http from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path"; // <-- Perubahan di sini

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Fix Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`Mencoba reconnect ke Redis... (${retries})`);
      return 5000; // Coba reconnect setiap 5 detik
    },
  },
});

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connected");
    await redisClient.set("connection_test", "success");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
    process.exit(1);
  }
})();

// 2. Set timezone
process.env.TZ = "Asia/Jakarta";

// 3. Initialize Express
const app = express();

// 4. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 5. Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://your-production-domain.com"],
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());

// 6. PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 7. Logging middleware
app.use((req, _, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// 8. Prediction endpoint
app.get("/api/prediksi/:lokasiId", async (req, res) => {
  try {
    const { lokasiId } = req.params;
    let hour = parseInt(req.query.jam) || new Date().getHours();
    let day = parseInt(req.query.hari) || new Date().getDay();

    if (hour < 0 || hour > 23 || day < 0 || day > 6) {
      return res.status(400).json({
        error: "Invalid parameters",
        detail: "Hour: 0-23, Day: 0-6 (0=Sunday)",
      });
    }

    const pythonCommand = `"${
      process.env.PYTHON_PATH || "python3"
    }" predict.py predict ${hour} ${day}`;

    exec(pythonCommand, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error("Prediction error:", { error, stderr });
        return res.status(500).json({
          error: "Prediction failed",
          detail: "AI model processing error",
        });
      }

      const prediction = parseInt(stdout);
      if (isNaN(prediction)) {
        throw new Error("Invalid model output");
      }

      res.json({
        success: true,
        prediksi: ["kosong", "ramai", "penuh"][prediction],
        jam: hour,
        hari: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][
          day
        ],
        timestamp: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error("Prediction system error:", err);
    res.status(500).json({
      error: "Prediction system error",
      detail: err.message,
    });
  }
});

// 9. Error handling and other endpoints remain similar with proper async/await
app.post("/api/lapor", async (req, res) => {
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

    await broadcastParkirUpdate();

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

// 7. Health Check Endpoint
app.get("/api/health", async (_, res) => {
  try {
    await pool.query("SELECT 1"); // Test query sederhana
    res.json({
      status: "OK",
      database: "CONNECTED",
      redis: client.isReady ? "CONNECTED" : "DISCONNECTED",
    });
  } catch (err) {
    res.json({ status: "WARNING", database: "DISCONNECTED" });
  }
});

app.get("/api/statistik", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        status, 
        COUNT(*) as total 
      FROM lokasi_parkir 
      GROUP BY status
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Endpoint Lokasi Parkir
app.get("/api/lokasi-parkir", async (req, res) => {
  try {
    const cacheKey = "parkirData";

    // Cek cache
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log("Mengambil data dari cache");
      return res.json(JSON.parse(cachedData));
    }

    // Jika tidak ada cache, query DB
    console.log("Mengambil data dari database");
    const result = await pool.query("SELECT * FROM lokasi_parkir");

    // Simpan ke cache (expire 1 menit)
    await client.setEx(cacheKey, 60, JSON.stringify(result.rows));

    res.json(result.rows);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// index.js (Backend)
app.get("/api/lokasi-parkir/filter", async (req, res) => {
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

// 9. Error Handling Global
app.use((err, _, res, __) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({
    error: "Kesalahan server",
    detail:
      process.env.NODE_ENV === "production"
        ? "Silakan hubungi admin"
        : err.message,
  });
});

// 10. Setup Socket.io

const broadcastParkirUpdate = async () => {
  try {
    const result = await pool.query("SELECT * FROM lokasi_parkir");
    io.emit("parkir-update", {
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    io.emit("parkir-error", {
      code: "DB_ERROR",
      message: "Gagal mengambil data parkir",
    });
  }
};

// 10. Server setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log(`
  🚀 Server running on port ${PORT}
  Mode: ${process.env.NODE_ENV || "development"}
  Database: ${dbUrl.hostname}
  Redis: ${redisClient.isReady ? "connected" : "disconnected"}
  `);
});
