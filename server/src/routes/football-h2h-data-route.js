const express = require('express');
const router = express.Router();
const { getFootballH2H } = require('../controller/football-h2h-data-controller');

router.get('/get-h2h', getFootballH2H);

module.exports = router;
