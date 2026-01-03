const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getFootballEvents = asyncHandler(async (req, res) => {
    try {
        const { from, to, league_id, match_id, team_id } = req.query;
        const apiKey = process.env.APIFOOTBALL_KEY;

        let url = `https://apiv3.apifootball.com/?action=get_events`;

        if (match_id) {
            url += `&match_id=${match_id}`;
        } else if (team_id && from && to) {
            url += `&team_id=${team_id}&from=${from}&to=${to}`;
        } else if (from && to) {
            url += `&from=${from}&to=${to}`;
            if (league_id) {
                url += `&league_id=${league_id}`;
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid parameters for get-events' });
        }

        url += `&APIkey=${apiKey}`;

        const response = await axios.get(url);

        // Check if the external API returned an error structure usually found in their responses
        if (response.data && response.data.error) {
            console.error("API Football Error:", response.data.error);
            return res.status(400).json({ success: false, message: response.data.error, data: [] });
        }

        // Pass through the data directly
        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching football events:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

module.exports = { getFootballEvents };

