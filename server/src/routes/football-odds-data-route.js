const express = require('express');
const router = express.Router();
const { getFootballOdds } = require('../controller/football-odds-data-controller');

router.get('/get-odds', getFootballOdds);

module.exports = router;
