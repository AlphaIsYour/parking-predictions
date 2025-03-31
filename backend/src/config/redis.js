import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`Mencoba reconnect ke Redis... (${retries})`);
      return 5000;
    },
  },
});

redisClient.on("connect", () => console.log("🔄 Connecting to Redis..."));
redisClient.on("ready", () => console.log("✅ Redis ready!"));
redisClient.on("error", (err) => console.error("❌ Redis error:", err));

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

export default redisClient;
