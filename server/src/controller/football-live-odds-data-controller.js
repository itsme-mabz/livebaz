const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballLiveOdds = asyncHandler(async (req, res) => {
    try {
        const apiKey = process.env.APIFOOTBALL_KEY;
        const url = `https://apiv3.apifootball.com/?action=get_live_odds_commmets&APIkey=${apiKey}`;

        const response = await axios.get(url);

        if (response.data && response.data.error) {
            console.error("API Football Live Odds Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football live odds:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballLiveOdds };
