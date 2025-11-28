const { getPredictions, getDateRange } = require("../service/predictionsService");

/**
 * Get predictions with filtering options
 * Query params:
 * - date: today, yesterday, tomorrow, or specific date (yyyy-mm-dd)
 * - from: start date (yyyy-mm-dd)
 * - to: end date (yyyy-mm-dd)
 * - country_id: filter by country
 * - league_id: filter by league
 * - match_id: specific match
 */
const getMathPredictions = async (req, res) => {
  try {
    const { date, from, to, country_id, league_id, match_id } = req.query;

    // Determine date range
    let dateRange;
    if (date) {
      dateRange = getDateRange(date);
    } else if (from && to) {
      dateRange = { from, to };
    } else {
      // Default to today
      dateRange = getDateRange('today');
    }

    console.log("Fetching predictions for:", dateRange);

    // Fetch predictions
    const predictions = await getPredictions({
      ...dateRange,
      country_id,
      league_id,
      match_id
    });

    res.json({
      success: true,
      message: "Predictions fetched successfully",
      data: predictions,
      count: predictions.length,
      filters: {
        dateRange,
        country_id,
        league_id,
        match_id
      }
    });
  } catch (error) {
    console.error("Error in getMathPredictions:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch predictions",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

/**
 * Get available leagues with predictions
 */
const getAvailableLeagues = async (req, res) => {
  try {
    const { date } = req.query;
    const dateRange = date ? getDateRange(date) : getDateRange('today');

    const predictions = await getPredictions(dateRange);

    // Extract unique leagues
    const leagues = [...new Set(predictions.map(p => ({
      name: p.league,
      country: p.country
    })))];

    res.json({
      success: true,
      data: leagues,
      count: leagues.length
    });
  } catch (error) {
    console.error("Error in getAvailableLeagues:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leagues",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

module.exports = {
  getMathPredictions,
  getAvailableLeagues
};
