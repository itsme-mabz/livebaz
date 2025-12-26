const express = require('express');
const router = express.Router();
const PopularItem = require('../model/popularItem.model');
const axios = require('axios');

const API_KEY = process.env.APIFOOTBALL_KEY;

// Public endpoint - Get active popular items (no auth required)
router.get('/popular-items', async (req, res) => {
  try {
    const { type } = req.query; // Filter by 'match' or 'league'

    const where = { is_active: true };
    if (type) {
      where.type = type;
    }

    const popularItems = await PopularItem.findAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: 20 // Limit to top 20 items
    });

    res.status(200).json({
      success: true,
      count: popularItems.length,
      data: popularItems
    });
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular items',
      error: error.message
    });
  }
});

// Public endpoint - Get match details by match IDs
router.get('/matches-by-ids', async (req, res) => {
  try {
    const { match_ids } = req.query;

    if (!match_ids) {
      return res.status(400).json({
        success: false,
        message: 'match_ids parameter is required'
      });
    }

    const idsArray = match_ids.split(',');
    const matches = [];

    for (const matchId of idsArray) {
      try {
        const response = await axios.get(
          `https://apiv3.apifootball.com/?action=get_events&match_id=${matchId}&APIkey=${API_KEY}`
        );
        if (response.data && response.data.length > 0) {
          matches.push(response.data[0]);
        }
      } catch (error) {
        console.error(`Error fetching match ${matchId}:`, error.message);
      }
    }

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching matches',
      error: error.message
    });
  }
});

module.exports = router;
