const express = require('express');
const router = express.Router();
const { getFootballEvents } = require('../controller/football-events-data-controller');

router.get('/get-events', getFootballEvents);

module.exports = router;
