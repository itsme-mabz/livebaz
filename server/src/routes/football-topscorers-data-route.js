const express = require('express');
const router = express.Router();
const { getFootballTopScorers } = require('../controller/football-topscorers-data-controller');

router.get('/get-topscorers', getFootballTopScorers);

module.exports = router;
