const axios = require("axios");

const API_BASE = "https://v3.football.api-sports.io";

const headers = {
  "x-apisports-key": process.env.API_SPORTS_KEY
};

// Get live fixtures
async function getLiveFixtures() {
  try {
    const res = await axios.get(`${API_BASE}/fixtures?live=all`, { headers });
    return res.data.response; // array of live matches
  } catch (err) {
    console.error("Error fetching live fixtures:", err.message);
    return [];
  }
}

// Get fixture events
async function getFixtureEvents(fixtureId) {
  try {
    const res = await axios.get(`${API_BASE}/fixtures/events?fixture=${fixtureId}`, { headers });
    return res.data.response;
  } catch (err) {
    console.error(`Error fetching events for fixture ${fixtureId}:`, err.message);
    return [];
  }
}

// Get odds for a fixture
async function getFixtureOdds(fixtureId) {
  try {
    const res = await axios.get(`${API_BASE}/odds?fixture=${fixtureId}`, { headers });
    return res.data.response;
  } catch (err) {
    console.error(`Error fetching odds for fixture ${fixtureId}:`, err.message);
    return [];
  }
}

module.exports = {
  getLiveFixtures,
  getFixtureEvents,
  getFixtureOdds
};
