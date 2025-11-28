const app = require("./app.js");

const dotenv = require("dotenv");
const { connectDB, sequelize } = require("./config/db.js");

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
<<<<<<< HEAD
  .sync({ force: false }) // force: false keeps existing tables
  .then(() => console.log("Database synced successfully"))
  .catch((err) => {
    console.error("DB Sync Error (continuing without MySQL):", err.message);
  });
=======
  .sync({ force: false, alter: false }) // Data will NOT be deleted
  .then(() => console.log("MYSQL CONNECTED SUCCESSFULLY"))
  .catch((err) => console.log("DB ERROR:", err));
>>>>>>> 0f874b23d2a19cad4a5c8cb2b26b1ecb5d928e2d

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

// handle unhandled promise rejection (commented out to allow server to run without MySQL)
// process.on("unhandledRejection", (err) => {
//   console.log(`Error: ${err.message}`);
//   console.log(`Shutting down the server due to unhandled promise rejection`);
//   server.close(() => {
//     process.exit(1);
//   });
// });
