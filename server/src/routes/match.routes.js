const express = require("express");
const { getAllPredictions } = require("../controller/Homecontroller");


const router = express.Router();


router.get("/predictions", getAllPredictions);


module.exports = router
