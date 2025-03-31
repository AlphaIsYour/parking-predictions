import pool from "../config/postgres.js";

export const broadcastParkirUpdate = async (io) => {
  try {
    const result = await pool.query("SELECT * FROM lokasi_parkir");
    io.emit("parkir-update", {
      status: "success",
      data: result.rows,
      message: "Data parkir diperbarui!",
    });
  } catch (err) {
    io.emit("parkir-error", {
      code: "DB_ERROR",
      message: "Gagal mengambil data parkir",
    });
  }
};
