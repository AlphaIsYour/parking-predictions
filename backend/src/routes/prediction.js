import express from "express";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/api/prediksi/:lokasiId", async (req, res) => {
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
      process.env.PYTHON_PATH
    }" "${process.cwd()}/src/scripts/predict.py" predict ${hour} ${day}`;

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

export default router;
