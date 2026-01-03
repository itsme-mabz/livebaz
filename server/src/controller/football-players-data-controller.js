const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballPlayers = asyncHandler(async (req, res) => {
    try {
        const { player_id } = req.query;
        const apiKey = process.env.APIFOOTBALL_KEY;

        if (!player_id) {
            return res.status(400).json({ success: false, message: 'Missing "player_id" parameter' });
        }

        const url = `https://apiv3.apifootball.com/?action=get_players&player_id=${player_id}&APIkey=${apiKey}`;

        const response = await axios.get(url);

        if (response.data && response.data.error) {
            console.error("API Football Players Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football players:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballPlayers };
