const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const { exec } = require("child_process");
require("dotenv").config();

// 0. Konfigurasi Timezone (Asia/Jakarta)
process.env.TZ = "Asia/Jakarta";

// 1. Inisialisasi Express
const app = express();

// 2. Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://your-production-domain.com"],
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.get("/api/test", (_, res) => {
  res.json({ message: "Backend connected!" });
});

app.use(express.json());

// 3. Koneksi PostgreSQL dengan Pooling Optimal
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 4. Middleware Logging untuk Debugging
app.use((req, _, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// 5. Endpoint Prediksi (Diperbaiki)
app.get("/api/prediksi/:lokasiId", async (req, res) => {
  try {
    const { lokasiId } = req.params;
    let hour = parseInt(req.query.jam);
    let day = parseInt(req.query.hari);

    // Validasi input
    if (isNaN(hour)) hour = new Date().getHours();
    if (isNaN(day)) day = new Date().getDay();

    // Validasi range
    if (hour < 0 || hour > 23 || day < 0 || day > 6) {
      return res.status(400).json({
        error: "Parameter tidak valid",
        detail: "Jam: 0-23, Hari: 0-6 (0=Minggu)",
      });
    }

    // Eksekusi model ML
    exec(
      `C:/laragon/www/parking-ub/.venv/Scripts/python.exe predict.py predict ${hour} ${day}`,
      { cwd: __dirname },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Error prediksi:", { error, stderr });
          return res.status(500).json({
            error: "Gagal melakukan prediksi",
            detail: "Model AI tidak dapat memproses data",
          });
        }

        const prediksi = parseInt(stdout);
        if (isNaN(prediksi)) throw new Error("Output model tidak valid");

        res.json({
          success: true,
          prediksi: ["kosong", "ramai", "penuh"][prediksi],
          jam: hour,
          hari: [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
          ][day],
          timestamp: new Date().toISOString(),
        });
      }
    );
  } catch (err) {
    console.error("Error sistem prediksi:", err);
    res.status(500).json({
      error: "Kesalahan sistem prediksi",
      detail: err.message,
    });
  }
});

// 6. Endpoint Lapor Parkir (Diperkuat)
app.post("/api/lapor", async (req, res) => {
  try {
    const { status, lokasiId } = req.body;

    // Validasi input
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

    // Transaction untuk menjaga konsistensi data
    await pool.query("BEGIN");

    // Update status
    const updateResult = await pool.query(
      `UPDATE lokasi_parkir 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [status, lokasiId]
    );

    // Simpan histori
    await pool.query(
      `INSERT INTO laporan_parkir (lokasi_id, kepadatan) 
       VALUES ($1, $2)`,
      [lokasiId, status]
    );

    await pool.query("COMMIT");

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
app.get("/api/health", (_, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: pool.totalCount > 0 ? "CONNECTED" : "DISCONNECTED",
    memoryUsage: process.memoryUsage(),
  });
});

// 8. Error Handling Global
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

// 9. Jalankan Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`
  🚀 Server berjalan di port ${PORT}
  Mode: ${process.env.NODE_ENV || "development"}
  Database: ${pool.options.connectionString.split("@")[1]}
  `);
});
