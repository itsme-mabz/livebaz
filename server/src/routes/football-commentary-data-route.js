const express = require('express');
const router = express.Router();
const { getFootballCommentary } = require('../controller/football-commentary-data-controller');

router.get('/get-commentary', getFootballCommentary);

module.exports = router;
