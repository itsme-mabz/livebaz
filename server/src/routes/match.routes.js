const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/matchesController");
const { getAllPredictions } = require("../controller/Homecontroller.js");
router.get("/live", ctrl.getLive);
router.get("/:id", ctrl.getById);

router.get("/predictions", getAllPredictions);

module.exports = router;
