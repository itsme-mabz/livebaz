const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

// Serve static files for local uploads
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// DEBUG: Log all requests - moved to top
app.use((req, res, next) => {
  console.log(`[DEBUG_LOG] ${req.method} ${req.url}`);
  next();
});


const dotenv = require("dotenv");
dotenv.config();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://livebaz.com", "https://www.livebaz.com"], // allow requests from frontend
    credentials: true, // allow cookies to be sent
  })
);
app.use(cookieParser()); // parse cookies
app.use(express.json({ limit: "50mb" })); // parse JSON with size limit
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // parse URL-encoded data



// Import Routes

const userRoutes = require("./routes/authRoutes");

const matchRoutes = require("./routes/match.routes");

const predictionsRoutes = require("./routes/predictions.routes");

const adminRoutes = require("./routes/admin.routes");

const publicRoutes = require("./routes/public.routes");

const blogRoutes = require("./routes/blog.routes");

const blogAdminRoutes = require("./routes/blog.admin.routes");

const translationRoutes = require("./routes/translation.routes");
const footballEventsRoutes = require("./routes/football-events-data-route");
const footballPredictionsRoutes = require("./routes/football-prediction-data-route");
const footballStandingsRoutes = require("./routes/football-standings-data-route");
const footballPlayersRoutes = require("./routes/football-players-data-route");
const footballH2HRoutes = require("./routes/football-h2h-data-route");
const footballOddsRoutes = require("./routes/football-odds-data-route");
const footballCommentaryRoutes = require("./routes/football-commentary-data-route");
const footballStatisticsRoutes = require("./routes/football-statistics-data-route");
const footballTopScorersRoutes = require("./routes/football-topscorers-data-route");
const footballLeaguesRoutes = require("./routes/football-leagues-data-route");
const footballTeamsRoutes = require("./routes/football-teams-data-route");
const footballLiveOddsRoutes = require("./routes/football-live-odds-data-route");

app.use("/api/v1/user", userRoutes);

app.use("/api/v1/match", matchRoutes);

app.use("/api/v1/predictions", predictionsRoutes);

app.use("/api/v1/admin", blogAdminRoutes); // Priority (Blog Admin)

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/public", publicRoutes);

app.use("/api/v1", blogRoutes);

app.use("/api/v1/translations", translationRoutes);

app.use("/api/v1/football-events", footballEventsRoutes);
app.use("/api/v1/football-events", footballPredictionsRoutes);
app.use("/api/v1/football-events", footballStandingsRoutes);
app.use("/api/v1/football-events", footballPlayersRoutes);
app.use("/api/v1/football-events", footballH2HRoutes);
app.use("/api/v1/football-events", footballOddsRoutes);
app.use("/api/v1/football-events", footballCommentaryRoutes);
app.use("/api/v1/football-events", footballStatisticsRoutes);
app.use("/api/v1/football-events", footballTopScorersRoutes);
app.use("/api/v1/football-events", footballLiveOddsRoutes);
app.use("/api/v1/football-events", footballLeaguesRoutes);
app.use("/api/v1/football-events", footballTeamsRoutes);

// Error Middleware (must be last)
const errorMiddleware = require("./middleware/error.middleware");
app.use(errorMiddleware);

// Custom 404 Handler for Debugging
app.use((req, res) => {
  res.status(404).send(`MY_CUSTOM_404: Route ${req.originalUrl || req.url} not found on server port ${process.env.PORT}`);
});

module.exports = app;
