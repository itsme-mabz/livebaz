const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);
async function setCache(key, value, ttl = 10) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (e) {
    console.error(e.message);
  }
}
async function getCache(key) {
  try {
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    console.error(e.message);
    return null;
  }
}
async function delCache(key) {
  try {
    await redis.del(key);
  } catch (e) {
    console.error(e.message);
  }
}
module.exports = { redis, setCache, getCache, delCache };
