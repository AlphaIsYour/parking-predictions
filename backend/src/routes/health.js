import express from "express";
import pool from "../config/postgres.js";
import redisClient from "../config/redis.js";

const router = express.Router();

router.get("/api/health", async (_, res) => {
  try {
    await pool.query("SELECT 1"); // Test query sederhana
    res.json({
      status: "OK",
      database: "CONNECTED",
      redis: redisClient.isReady ? "CONNECTED" : "DISCONNECTED",
    });
  } catch (err) {
    res.json({ status: "WARNING", database: "DISCONNECTED" });
  }
});

router.get("/statistik", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*) as total 
      FROM lokasi_parkir 
      GROUP BY status
    `);
    res.json(result.rows); // <-- Pastikan mengembalikan JSON
  } catch (err) {
    res.status(500).json({ error: err.message }); // <-- Error juga harus JSON
  }
});

export default router;
