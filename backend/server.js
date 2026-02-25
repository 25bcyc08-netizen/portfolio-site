
// Import required packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import Contact model
const Contact = require("./models/Contact");

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static("public"));

/* ===============================
   MongoDB Atlas Connection
================================= */
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Atlas Connected Successfully");
})
.catch((error) => {
    console.error("❌ Database Connection Error:", error);
});

/* ===============================
   Routes
================================= */

// Test Route
app.get("/api/test", (req, res) => {
    res.json({ message: "API is working properly" });
});

// Contact Form Route
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Create new contact document
        const newContact = new Contact({
            name,
            email,
            message
        });

        // Save to MongoDB Atlas
        await newContact.save();

        res.status(201).json({
            message: "Message saved successfully!"
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

/* ===============================
   404 Handler
================================= */
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

/* ===============================
   Start Server
================================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});