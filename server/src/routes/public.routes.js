const express = require('express');
const router = express.Router();
const PopularItem = require('../model/popularItem.model');

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

module.exports = router;
