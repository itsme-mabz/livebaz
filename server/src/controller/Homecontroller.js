const axios = require("axios");

const API_KEY = process.env.APIFOOTBALL_KEY; // Paid API key

// GET Home Page Predictions
const getAllPredictions = async (req, res) => {
  const { league_ids, from, to } = req.query;

  if (!league_ids || !from || !to) {
    return res.status(400).json({
      success: false,
      message: "league_ids, from, and to are required",
    });
  }

  try {
    const leaguesArray = league_ids.split(","); // multiple league_ids separated by comma
    let allMatches = [];

    // Fetch matches for each league
    for (const league_id of leaguesArray) {
      const response = await axios.get(
        `https://apiv2.apifootball.com/?action=get_events&league_id=${league_id}&from=${from}&to=${to}&APIkey=${API_KEY}`
      );

      const matches = response.data;
      console.log(matches);

      // Generate simple predictions
      const predictedMatches = matches.map((match) => {
        let prediction = "Draw";
        const homeScore = parseInt(match.match_hometeam_score) || 0;
        const awayScore = parseInt(match.match_awayteam_score) || 0;

        if (homeScore > awayScore) prediction = match.match_hometeam_name;
        else if (homeScore < awayScore) prediction = match.match_awayteam_name;

        return {
          match_id: match.match_id,
          league: match.league_name,
          home_team: match.match_hometeam_name,
          away_team: match.match_awayteam_name,
          match_date: match.match_date,
          match_time: match.match_time,
          prediction,

              home_score: homeScore,
    away_score: awayScore,
    live_minute: match.match_status, // or match.match_live if available
    home_badge: match.team_home_badge || null,
    away_badge: match.team_away_badge || null,
        };
      });

      allMatches = [...allMatches, ...predictedMatches];
    }

    res.json({
      success: true,
      message: "All predictions fetched successfully",
      data: allMatches,
    });
  } catch (error) {
    console.error("APIFootball error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch predictions from API",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { getAllPredictions };
