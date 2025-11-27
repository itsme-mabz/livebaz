const express = require("express");
const {
  getMathPredictions,
  getAvailableLeagues
} = require("../controller/predictionsController");

const router = express.Router();

// Get math predictions with filters
router.get("/", getMathPredictions);

// Get available leagues
router.get("/leagues", getAvailableLeagues);

module.exports = router;
