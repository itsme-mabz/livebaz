const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballPredictions = asyncHandler(async (req, res) => {
    try {
        const { from, to, match_id, league_id } = req.query;
        const apiKey = process.env.APIFOOTBALL_KEY;

        let url = `https://apiv3.apifootball.com/?action=get_predictions`;

        if (match_id) {
            url += `&match_id=${match_id}`;
        } else if (from && to) {
            url += `&from=${from}&to=${to}`;
            if (league_id) {
                url += `&league_id=${league_id}`;
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid parameters: provide "match_id" OR "from" and "to" dates' });
        }

        url += `&APIkey=${apiKey}`;

        const response = await axios.get(url);

        if (response.data && response.data.error) {
            console.error("API Football Prediction Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football predictions:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballPredictions };
