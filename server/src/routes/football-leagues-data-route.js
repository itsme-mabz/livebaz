const express = require('express');
const router = express.Router();
const { getFootballLeagues } = require('../controller/football-leagues-data-controller');

router.get('/get-leagues', getFootballLeagues);

module.exports = router;
