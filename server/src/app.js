// server.js
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();


// All Routes call 
const matchRoutes = require('./routes/match.routes');
const authRoutes = require('./routes/authRoutes');


// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/match', matchRoutes);







module.exports = app;


