const axios = require("axios");

const API_KEY = process.env.APIFOOTBALL_KEY;
const API_BASE = "https://apiv3.apifootball.com";

/**
 * Fetch predictions from API Football
 * @param {string} from - Start date (yyyy-mm-dd)
 * @param {string} to - End date (yyyy-mm-dd)
 * @param {string} country_id - Optional country filter
 * @param {string} league_id - Optional league filter
 * @param {string} match_id - Optional match filter
 * @returns {Promise<Array>} Array of predictions
 */
async function getPredictions(params = {}) {
  try {
    const { from, to, country_id, league_id, match_id } = params;

    // Build query parameters
    const queryParams = new URLSearchParams({
      action: "get_predictions",
      APIkey: API_KEY,
      from: from || new Date().toISOString().split('T')[0],
      to: to || new Date().toISOString().split('T')[0]
    });

    // Add optional filters
    if (country_id) queryParams.append('country_id', country_id);
    if (league_id) queryParams.append('league_id', league_id);
    if (match_id) queryParams.append('match_id', match_id);

    const url = `${API_BASE}?${queryParams.toString()}`;
    console.log("Fetching predictions from:", url);

    const response = await axios.get(url);

    if (!response.data || response.data.error) {
      console.error("API error:", response.data?.error);
      return [];
    }

    return transformPredictions(response.data);
  } catch (error) {
    console.error("Error fetching predictions:", error.message);
    throw error;
  }
}

/**
 * Transform API response to match frontend format
 * @param {Array} apiData - Raw API response
 * @returns {Array} Transformed predictions
 */
function transformPredictions(apiData) {
  if (!Array.isArray(apiData)) {
    return [];
  }

  return apiData.map((match) => {
    // Extract probabilities safely
    const probHW = parseFloat(match.prob_HW) || 0;
    const probD = parseFloat(match.prob_D) || 0;
    const probAW = parseFloat(match.prob_AW) || 0;
    const probO = parseFloat(match.prob_O) || 0;
    const probU = parseFloat(match.prob_U) || 0;
    const probBTS = parseFloat(match.prob_bts) || 0;

    // Calculate odds from probabilities (odds ≈ 1/probability)
    const calculateOdds = (prob) => prob > 0 ? (1 / (prob / 100)).toFixed(2) : 1.00;

    // Determine best tip based on highest probability
    const bestTip = determineBestTip({
      probHW,
      probD,
      probAW,
      probO,
      probU,
      probBTS
    });

    // Determine live status
    const isLive = match.match_live === "1" || match.match_status === "Live";
    const liveTime = isLive ? match.match_status : null;

    // Determine match status
    let matchStatus = "Not Started";
    if (isLive) {
      matchStatus = "Live";
    } else if (match.match_status === "Finished" || match.match_status === "FT") {
      matchStatus = "Finished";
    }

    return {
      id: match.match_id,
      league_id: match.league_id,
      time: formatMatchTime(match.match_date, match.match_time),
      league: match.league_name?.toUpperCase() || "UNKNOWN LEAGUE",
      country: match.country_name,
      homeTeam: match.match_hometeam_name,
      awayTeam: match.match_awayteam_name,
      homeScore: match.match_hometeam_score || "-",
      awayScore: match.match_awayteam_score || "-",
      status: matchStatus,
      isLive: isLive,
      liveTime: liveTime,
      predictions: {
        "1x2": {
          w1: {
            odds: calculateOdds(probHW),
            prob: Math.round(probHW)
          },
          draw: {
            odds: calculateOdds(probD),
            prob: Math.round(probD)
          },
          w2: {
            odds: calculateOdds(probAW),
            prob: Math.round(probAW)
          }
        },
        goals: {
          over: {
            odds: calculateOdds(probO),
            prob: Math.round(probO)
          },
          under: {
            odds: calculateOdds(probU),
            prob: Math.round(probU)
          }
        },
        btts: {
          yes: {
            odds: calculateOdds(probBTS),
            prob: Math.round(probBTS)
          },
          no: {
            odds: calculateOdds(100 - probBTS),
            prob: Math.round(100 - probBTS)
          }
        },
        bestTip
      }
    };
  });
}

/**
 * Determine the best betting tip based on probabilities
 */
function determineBestTip(probs) {
  const { probHW, probD, probAW, probO, probU, probBTS } = probs;

  const tips = [
    { type: "1X2 : W1", prob: probHW, category: "1x2" },
    { type: "1X2 : Draw", prob: probD, category: "1x2" },
    { type: "1X2 : W2", prob: probAW, category: "1x2" },
    { type: "Goals : O 2.5", prob: probO, category: "goals" },
    { type: "Goals : U 2.5", prob: probU, category: "goals" },
    { type: "BTTS : Yes", prob: probBTS, category: "btts" },
    { type: "BTTS : No", prob: 100 - probBTS, category: "btts" }
  ];

  // Find tip with highest probability
  const best = tips.reduce((max, tip) => tip.prob > max.prob ? tip : max, tips[0]);

  return {
    type: best.type,
    odds: (1 / (best.prob / 100)).toFixed(2),
    probability: Math.round(best.prob)
  };
}

/**
 * Format match date and time
 */
function formatMatchTime(date, time) {
  if (!date) return "TBD";

  // Format: DD.MM.YY\nHH:MM
  const [year, month, day] = date.split('-');
  const shortYear = year ? year.slice(2) : '00';
  return `${day}.${month}.${shortYear}\n${time || '00:00'}`;
}

/**
 * Get date range for common filters
 */
function getDateRange(filter) {
  const today = new Date();
  const formatDate = (date) => date.toISOString().split('T')[0];

  switch (filter) {
    case 'today':
      return { from: formatDate(today), to: formatDate(today) };

    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: formatDate(yesterday), to: formatDate(yesterday) };

    case 'tomorrow':
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: formatDate(tomorrow), to: formatDate(tomorrow) };

    default:
      // Assume it's a specific date
      return { from: filter, to: filter };
  }
}

module.exports = {
  getPredictions,
  getDateRange
};
