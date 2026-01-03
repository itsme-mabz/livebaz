const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballLeagues = asyncHandler(async (req, res) => {
    try {
        const { country_id, league_id } = req.query;
        const apiKey = process.env.APIFOOTBALL_KEY;

        let url = `https://apiv3.apifootball.com/?action=get_leagues&APIkey=${apiKey}`;

        if (league_id) {
            url += `&league_id=${league_id}`;
        } else if (country_id) {
            url += `&country_id=${country_id}`;
        }

        const response = await axios.get(url);

        if (response.data && response.data.error) {
            console.error("API Football Leagues Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football leagues:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballLeagues };
