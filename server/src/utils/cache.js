const Redis = require("ioredis");
const redis = new Redis();

async function setCache(key, value, ttl = 10) {
  await redis.set(key, JSON.stringify(value), "EX", ttl); // ttl seconds
}

async function getCache(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

module.exports = { setCache, getCache };
