const express = require('express');
const router = express.Router();
const { getFootballStatistics } = require('../controller/football-statistics-data-controller');

router.get('/get-statistics', getFootballStatistics);

module.exports = router;
