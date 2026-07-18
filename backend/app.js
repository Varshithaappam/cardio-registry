const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Initialize Express App
const app = express();

// Initialize Database Connection
require("./config/db");

// Import Routes
const patientRoutes = require("./routes/patientRoutes");
const hfRoutes = require("./routes/hfRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Care Registry Backend Running Successfully 🚀"
    });
});

// Patient Routes
app.use("/api/patients", patientRoutes);
app.use("/api/hf-assessment", hfRoutes);

// Handle Unknown Routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

module.exports = app;