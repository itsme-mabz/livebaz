const PopularItem = require('../model/popularItem.model');

// Get all popular items
exports.getPopularItems = async (req, res) => {
  try {
    const { type } = req.query; // Filter by 'match' or 'league'

    const where = {};
    if (type) {
      where.type = type;
    }

    const popularItems = await PopularItem.findAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ]
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
};

// Add a new popular item
exports.addPopularItem = async (req, res) => {
  try {
    const { type, item_id, item_name, item_data, priority } = req.body;

    // Validation
    if (!type || !item_id || !item_name) {
      return res.status(400).json({
        success: false,
        message: 'Type, item_id, and item_name are required'
      });
    }

    if (!['match', 'league'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "match" or "league"'
      });
    }

    // Check if item already exists
    const existingItem = await PopularItem.findOne({
      where: { type, item_id }
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'This item is already in the popular list'
      });
    }

    // Create new popular item
    const popularItem = await PopularItem.create({
      type,
      item_id,
      item_name,
      item_data: item_data || {},
      priority: priority || 0,
      added_by: req.user.id // From auth middleware
    });

    res.status(201).json({
      success: true,
      message: 'Popular item added successfully',
      data: popularItem
    });
  } catch (error) {
    console.error('Error adding popular item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding popular item',
      error: error.message
    });
  }
};

// Remove a popular item
exports.removePopularItem = async (req, res) => {
  try {
    const { id } = req.params;

    const popularItem = await PopularItem.findByPk(id);

    if (!popularItem) {
      return res.status(404).json({
        success: false,
        message: 'Popular item not found'
      });
    }

    await popularItem.destroy();

    res.status(200).json({
      success: true,
      message: 'Popular item removed successfully'
    });
  } catch (error) {
    console.error('Error removing popular item:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing popular item',
      error: error.message
    });
  }
};

// Update popular item
exports.updatePopularItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority, is_active, item_name, item_data } = req.body;

    const popularItem = await PopularItem.findByPk(id);

    if (!popularItem) {
      return res.status(404).json({
        success: false,
        message: 'Popular item not found'
      });
    }

    // Update fields if provided
    if (priority !== undefined) popularItem.priority = priority;
    if (is_active !== undefined) popularItem.is_active = is_active;
    if (item_name) popularItem.item_name = item_name;
    if (item_data) popularItem.item_data = item_data;

    await popularItem.save();

    res.status(200).json({
      success: true,
      message: 'Popular item updated successfully',
      data: popularItem
    });
  } catch (error) {
    console.error('Error updating popular item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating popular item',
      error: error.message
    });
  }
};

// Search matches from API to add as popular
exports.searchMatches = async (req, res) => {
  try {
    const axios = require('axios');
    const { query, date } = req.query;

    if (!query && !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query or date'
      });
    }

    const API_KEY = process.env.APIFOOTBALL_KEY;
    const dateStr = date || new Date().toISOString().split('T')[0];
    const url = `https://apiv3.apifootball.com/?action=get_events&from=${dateStr}&to=${dateStr}&APIkey=${API_KEY}`;

    const response = await axios.get(url);

    if (!response.data || !Array.isArray(response.data)) {
      return res.status(404).json({
        success: false,
        message: 'No matches found'
      });
    }

    let matches = response.data;

    // Filter by query if provided
    if (query) {
      matches = matches.filter(match =>
        match.match_hometeam_name.toLowerCase().includes(query.toLowerCase()) ||
        match.match_awayteam_name.toLowerCase().includes(query.toLowerCase()) ||
        match.league_name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Format matches for frontend
    const formattedMatches = matches.slice(0, 50).map(match => ({
      match_id: match.match_id,
      home_team: match.match_hometeam_name,
      away_team: match.match_awayteam_name,
      league: match.league_name,
      date: match.match_date,
      time: match.match_time,
      home_logo: match.team_home_badge,
      away_logo: match.team_away_badge
    }));

    res.status(200).json({
      success: true,
      count: formattedMatches.length,
      data: formattedMatches
    });
  } catch (error) {
    console.error('Error searching matches:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching matches',
      error: error.message
    });
  }
};

// Search leagues from API
exports.searchLeagues = async (req, res) => {
  try {
    const axios = require('axios');
    const { query } = req.query;

    const API_KEY = process.env.APIFOOTBALL_KEY;
    const url = `https://apiv3.apifootball.com/?action=get_leagues&APIkey=${API_KEY}`;

    const response = await axios.get(url);

    if (!response.data || !Array.isArray(response.data)) {
      return res.status(404).json({
        success: false,
        message: 'No leagues found'
      });
    }

    let leagues = response.data;

    // Filter by query if provided
    if (query) {
      leagues = leagues.filter(league =>
        league.league_name.toLowerCase().includes(query.toLowerCase()) ||
        league.country_name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Format leagues for frontend
    const formattedLeagues = leagues.slice(0, 50).map(league => ({
      league_id: league.league_id,
      league_name: league.league_name,
      country: league.country_name,
      logo: league.league_logo
    }));

    res.status(200).json({
      success: true,
      count: formattedLeagues.length,
      data: formattedLeagues
    });
  } catch (error) {
    console.error('Error searching leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching leagues',
      error: error.message
    });
  }
};
