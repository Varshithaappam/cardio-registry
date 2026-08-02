const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Initialize Express App
const app = express();

// Import Routes
const patientRoutes = require("./routes/patientRoutes");
const hfRoutes = require("./routes/hfRoutes");
const documentRoutes = require("./routes/documentRoutes");
const hfFilesRoutes = require("./routes/hfFilesRoutes");
const authRoutes = require("./routes/authRoutes");
const hfRegistryRoutes = require("./routes/hfRegistryRoutes");
const hfController = require('./controllers/hfController');

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Health Check Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Care Registry Backend Running Successfully 🚀"
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/hf-registry", hfRegistryRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/hf-assessment", hfRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/hf-files", hfFilesRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get('/api/hf/history/:patientId', hfController.getHfHistory);

// Handle Unknown Routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

module.exports = app;
