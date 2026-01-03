const express = require('express');
const router = express.Router();
const { getFootballLiveOdds } = require('../controller/football-live-odds-data-controller');

router.get('/get-live-odds', getFootballLiveOdds);

module.exports = router;
