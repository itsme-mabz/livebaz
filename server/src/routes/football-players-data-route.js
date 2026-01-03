const express = require('express');
const router = express.Router();
const { getFootballPlayers } = require('../controller/football-players-data-controller');

router.get('/get-players', getFootballPlayers);

module.exports = router;
