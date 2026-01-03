const express = require('express');
const router = express.Router();
const { getFootballPredictions } = require('../controller/football-prediction-data-controller');

router.get('/get-predictions', getFootballPredictions);

module.exports = router;
