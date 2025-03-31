import redisClient from "../config/redis.js";

export const getCache = async (key) => {
  return await redisClient.get(key);
};

export const setCache = async (key, value, ttl = 60) => {
  await redisClient.setEx(key, ttl, JSON.stringify(value));
};
