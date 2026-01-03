const app = require("./app.js");

const dotenv = require("dotenv");
const { connectDB, sequelize } = require("./config/db.js");
const { initSocket } = require("./socketManager");

dotenv.config();

// handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});

// This is database connection (optional for predictions API)
connectDB().catch((err) => {
  console.log("MySQL connection not available, continuing without database:", err.message);
});

// SYNC MODELS
sequelize
  .sync({ alter: true }) // alter: true updates existing tables to match the models
  .then(() => console.log("Database synced successfully"))
  .catch((err) => {
    console.error("DB Sync Error (continuing without MySQL):", err.message);
  });

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from other devices: http://192.168.1.40:${PORT}`);
});

// Initialize WebSocket relay
initSocket(server);

// handle unhandled promise rejection (commented out to allow server to run without MySQL)
// process.on("unhandledRejection", (err) => {
//   console.log(`Error: ${err.message}`);
//   console.log(`Shutting down the server due to unhandled promise rejection`);
//   server.close(() => {
//     process.exit(1);
//   });
// });
