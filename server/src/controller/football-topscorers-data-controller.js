const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballTopScorers = asyncHandler(async (req, res) => {
    try {
        const { league_id } = req.query;
        const apiKey = process.env.APIFOOTBALL_KEY;

        if (!league_id) {
            return res.status(400).json({ success: false, message: 'Missing "league_id" parameter' });
        }

        const url = `https://apiv3.apifootball.com/?action=get_topscorers&league_id=${league_id}&APIkey=${apiKey}`;

        const response = await axios.get(url);

        if (response.data && response.data.error) {
            console.error("API Football Top Scorers Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football top scorers:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballTopScorers };
