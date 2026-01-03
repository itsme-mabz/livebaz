const express = require('express');
const router = express.Router();
const { getFootballStandings } = require('../controller/football-standings-data-controller');

router.get('/get-standings', getFootballStandings);

module.exports = router;
