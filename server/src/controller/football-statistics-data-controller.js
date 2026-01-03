const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballStatistics = asyncHandler(async (req, res) => {
    try {
        const { match_id } = req.query;
        const apiKey = process.env.APIFOOTBALL_KEY;

        if (!match_id) {
            return res.status(400).json({ success: false, message: 'Missing "match_id" parameter' });
        }

        const url = `https://apiv3.apifootball.com/?action=get_statistics&match_id=${match_id}&APIkey=${apiKey}`;

        const response = await axios.get(url);

        if (response.data && response.data.error) {
            console.error("API Football Statistics Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football statistics:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballStatistics };
