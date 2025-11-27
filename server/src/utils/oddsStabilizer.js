const { redis } = require("./cache");
const { Mutex } = require("async-mutex");
const mutex = new Mutex();
const THRESH = Number(process.env.ODDS_UPDATE_THRESHOLD_PERCENT || 5);
const DEBOUNCE_MS = Number(process.env.ODDS_DEBOUNCE_MS || 3000);

function percentDiff(a, b) {
  if (!a || a == 0) return 100;
  return Math.abs((b - a) / a) * 100;
}

async function stabilizeAndEmit(io, fixtureId, marketKey, newOdd) {
  if (!newOdd || isNaN(newOdd) || newOdd <= 0) return;
  const key = `odds:${fixtureId}:${marketKey}`;
  const release = await mutex.acquire();
  try {
    const oldStr = await redis.get(key);
    const old = oldStr ? Number(oldStr) : null;
    if (!old) {
      await redis.set(key, newOdd);
      io.to(`match_${fixtureId}`).emit("oddsUpdate", {
        fixtureId,
        marketKey,
        odds: newOdd,
      });
      return;
    }
    const diff = percentDiff(old, newOdd);
    if (diff < THRESH) {
      await redis.set(key, newOdd);
      io.to(`match_${fixtureId}`).emit("oddsUpdate", {
        fixtureId,
        marketKey,
        odds: newOdd,
      });
      return;
    }
    // big change: set temporary key then confirm after debounce
    const pendingKey = `${key}:pending`;
    await redis.set(pendingKey, newOdd, "PX", DEBOUNCE_MS);
    // Use redis keyspace notifications or simple timeout in poller: here we just set timer on server too
    setTimeout(async () => {
      const val = await redis.get(pendingKey);
      if (val && Number(val) === Number(newOdd)) {
        await redis.set(key, newOdd);
        await redis.del(pendingKey);
        io.to(`match_${fixtureId}`).emit("oddsUpdate", {
          fixtureId,
          marketKey,
          odds: newOdd,
          flagged: true,
        });
      }
    }, DEBOUNCE_MS + 50);
  } finally {
    release();
  }
}
module.exports = { stabilizeAndEmit };
