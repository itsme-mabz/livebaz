const axios = require("axios");
const API_BASE = process.env.API_BASE;
const headers = { "x-apisports-key": process.env.API_SPORTS_KEY };

// generic helper with error handling
async function get(path, params = {}) {
  try {
    const res = await axios.get(`${API_BASE}${path}`, {
      params,
      headers,
      timeout: 10000,
    });
    return res.data.response || [];
  } catch (e) {
    console.error("API error", path, e.message);
    return [];
  }
}

// exports
async function getLiveFixtures() {
  return await get("/fixtures", { live: "all" });
}
async function getFixturesByDate(date) {
  return await get("/fixtures", { date });
}
async function getFixturesByLeague(league, season) {
  return await get("/fixtures", { league, season });
}
async function getFixtureEvents(fixture) {
  return await get("/fixtures/events", { fixture });
}
async function getFixtureStatistics(fixture) {
  return await get("/fixtures/statistics", { fixture });
}
async function getFixtureLineups(fixture) {
  return await get("/fixtures/lineups", { fixture });
}
async function getFixtureOdds(fixture) {
  return await get("/odds", { fixture });
}
async function getTeam(id) {
  return await get("/teams", { id });
}
async function getPlayersByTeam(team, season) {
  return await get("/players/squads", { team, season });
}
async function getPlayer(id, season) {
  return await get("/players", { id, season });
}
async function getStandings(league, season) {
  return await get("/standings", { league, season });
}
async function getTopScorers(league, season) {
  return await get("/players/topscorers", { league, season });
}
async function getLeagues(country) {
  return await get("/leagues", { country });
}
module.exports = {
  getLiveFixtures,
  getFixturesByDate,
  getFixturesByLeague,
  getFixtureEvents,
  getFixtureStatistics,
  getFixtureLineups,
  getFixtureOdds,
  getTeam,
  getPlayersByTeam,
  getPlayer,
  getStandings,
  getTopScorers,
  getLeagues,
};
