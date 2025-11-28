const { getCache } = require("../utils/cache");
const api = require("../services/apiSportsService");

async function getLive(req, res) {
  const cached = await getCache("live_fixtures");
  return res.json({ success: true, data: cached || [] });
}
async function getById(req, res) {
  const id = req.params.id;
  const cached = await getCache(`fixture_detail_${id}`);
  if (cached) return res.json({ success: true, data: cached });
  // fallback to API direct
  const events = await api.getFixtureEvents(id);
  const stats = await api.getFixtureStatistics(id);
  const lineups = await api.getFixtureLineups(id);
  const data = { events, stats, lineups };
  return res.json({ success: true, data });
}
module.exports = { getLive, getById };
