const express = require("express");

const cors = require("cors");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

app.use(
  cors({
    origin: "http://localhost:5173", // allow requests from frontend
    credentials: true, // allow cookies to be sent
  })
);
app.use(express.json({ limit: "50mb" })); // parse JSON with size limit
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // parse URL-encoded data

// Import Routes

const userRoutes = require("./routes/authRoutes");

app.use("/api/v1/user", userRoutes);

module.exports = app;
