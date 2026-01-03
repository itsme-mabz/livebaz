const express = require('express');
const router = express.Router();
const { getFootballTeams } = require('../controller/football-teams-data-controller');

router.get('/get-teams', getFootballTeams);

module.exports = router;
