const express = require("express");

const cors = require("cors");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://livebaz.com", "https://www.livebaz.com"], // allow requests from frontend
    credentials: true, // allow cookies to be sent
  })
);
app.use(express.json({ limit: "50mb" })); // parse JSON with size limit
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // parse URL-encoded data

// Import Routes

const userRoutes = require("./routes/authRoutes");

const matchRoutes = require("./routes/match.routes");

const predictionsRoutes = require("./routes/predictions.routes");

const adminRoutes = require("./routes/admin.routes");

const publicRoutes = require("./routes/public.routes");

app.use("/api/v1/user", userRoutes);

app.use("/api/v1/match", matchRoutes);

app.use("/api/v1/predictions", predictionsRoutes);

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/public", publicRoutes);

module.exports = app;
