import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import limiter from "./middleware/limiter.js";
import logger from "./middleware/logger.js";
import healthRouter from "./routes/health.js";
import parkingRouter from "./routes/parking.js";
import predictionRouter from "./routes/prediction.js";
import { broadcastParkirUpdate } from "./utils/broadcast.js";
import redisClient from "./config/redis.js";

const app = express();

// Middleware
app.use(limiter);
app.use(
  cors({
    origin: ["http://localhost:3000", "https://localhost:8081"],
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());
app.use(logger);

// Routes
app.use("/api", healthRouter);
app.use("/api", parkingRouter);
app.use("/api", predictionRouter);

// Error Handling
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

app._router.stack.forEach((layer) => {
  if (layer.route) {
    console.log(
      `[ROUTE] ${layer.route.path} (${Object.keys(layer.route.methods)[0]})`
    );
  }
});

// Socket.io Setup
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Socket Events
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

export default server;
