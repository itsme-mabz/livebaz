const express = require("express");
const { liveMatches, fixtureDetails } = require("../controller/matchcontroller");
const router = express.Router();


router.get("/live", liveMatches);
router.get("/:id", fixtureDetails);

module.exports = router;
