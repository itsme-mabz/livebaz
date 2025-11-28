const api = require("./apiSportsService");
const { setCache, getCache } = require("../utils/cache");
const { stabilizeAndEmit } = require("../utils/oddsStabilizer");
const logger = require("../utils/logger");

const POLL_MS = Number(process.env.POLL_INTERVAL_MS || 8000);

async function processFixture(io, fixture) {
  const id = fixture.fixture.id;
  // fetch details
  const [events, stats, lineups, oddsRaw] = await Promise.all([
    api.getFixtureEvents(id),
    api.getFixtureStatistics(id),
    api.getFixtureLineups(id),
    api.getFixtureOdds(id),
  ]);
  // normalize a simple structure
  const detail = { fixture, events, stats, lineups };
  await setCache(
    `fixture_detail_${id}`,
    detail,
    Math.floor(POLL_MS / 1000) + 5
  );
  // emit match basic update
  io.to(`match_${id}`).emit("matchDetail", detail);
  // parse oddsRaw and stabilize
  // oddsRaw structure: array of bookmakers with bets -> values
  const normalizedOdds = [];
  for (const book of oddsRaw) {
    const name = book.bookmaker?.name || "book";
    for (const bet of book.bets || []) {
      const market = bet.name; // e.g., "Match Winner"
      for (const val of bet.values || []) {
        const label = val.value; // e.g., "Home"
        const odd = Number(val.odd);
        const marketKey = `${name}:${market}:${label}`;
        normalizedOdds.push({ marketKey, odd });
      }
    }
  }
  // emit & stabilize
  for (const o of normalizedOdds)
    await stabilizeAndEmit(io, id, o.marketKey, o.odd);
  // cache odds
  await setCache(
    `fixture_odds_${id}`,
    normalizedOdds,
    Math.floor(POLL_MS / 1000) + 5
  );
}

async function pollLoop(io) {
  logger.info("Poller tick");
  const live = await api.getLiveFixtures();
  await setCache("live_fixtures", live, Math.floor(POLL_MS / 1000) + 3);
  for (const fixture of live) {
    // handle each fixture (no await to parallelize)
    processFixture(io, fixture).catch((err) =>
      logger.error("processFixture err", err.message)
    );
  }
}

async function start(io) {
  await pollLoop(io);
  setInterval(() => {
    pollLoop(io).catch((e) => logger.error("pollLoop err", e.message));
  }, POLL_MS);
}

module.exports = { start };
