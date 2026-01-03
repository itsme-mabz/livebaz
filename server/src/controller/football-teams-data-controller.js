const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballTeams = asyncHandler(async (req, res) => {
    try {
        const { league_id, team_id } = req.query;
        const apiKey = process.env.APIFOOTBALL_KEY;

        let url = `https://apiv3.apifootball.com/?action=get_teams&APIkey=${apiKey}`;

        if (league_id) {
            url += `&league_id=${league_id}`;
        } else if (team_id) {
            url += `&team_id=${team_id}`;
        } else {
            return res.status(400).json({ success: false, message: 'Missing "league_id" or "team_id" parameter' });
        }

        const response = await axios.get(url);

        if (response.data && response.data.error) {
            console.error("API Football Teams Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football teams:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballTeams };
