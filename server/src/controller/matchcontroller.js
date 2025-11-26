const { getLiveFixtures, getFixtureEvents, getFixtureOdds } = require("./apiSportsService");
const { setCache, getCache } = require("../utils/cache");

// Get homepage live matches
async function liveMatches(req, res) {
  const cacheKey = "live_matches";
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const fixtures = await getLiveFixtures();
  await setCache(cacheKey, fixtures, 5); // 5 sec cache
  res.json(fixtures);
}

// Get fixture details with events + odds
async function fixtureDetails(req, res) {
  const fixtureId = req.params.id;
  const cacheKey = `fixture_${fixtureId}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const [events, odds] = await Promise.all([
    getFixtureEvents(fixtureId),
    getFixtureOdds(fixtureId)
  ]);

  const data = { events, odds };
  await setCache(cacheKey, data, 5);
  res.json(data);
}

module.exports = { liveMatches, fixtureDetails };
