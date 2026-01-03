const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballH2H = asyncHandler(async (req, res) => {
    try {
        const { firstTeamId, secondTeamId } = req.query;
        const apiKey = process.env.APIFOOTBALL_KEY;

        if (!firstTeamId || !secondTeamId) {
            return res.status(400).json({ success: false, message: 'Missing "firstTeamId" or "secondTeamId" parameter' });
        }

        const url = `https://apiv3.apifootball.com/?action=get_H2H&firstTeamId=${firstTeamId}&secondTeamId=${secondTeamId}&APIkey=${apiKey}`;

        const response = await axios.get(url);

        if (response.data && response.data.error) {
            console.error("API Football H2H Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football H2H:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballH2H };
