const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB, getMongoStatus } = require("./src/config/db");
const Restaurant = require("./src/models/Restaurant");
const Feedback = require("./src/models/Feedback");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const fallbackFeedbackStore = [];

app.use(cors());
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("CityWise Food Explorer API is running.");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongoConnected: getMongoStatus(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Cities ───────────────────────────────────────────────────────────────────
// Returns the distinct list of cities present in the DB.
app.get("/api/cities", async (req, res) => {
  try {
    const cities = await Restaurant.distinct("city");
    res.json({ cities: cities.sort() });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch cities." });
  }
});

// ─── Restaurants ──────────────────────────────────────────────────────────────
// GET /api/restaurants?city=Pune&mealType=Breakfast&maxPrice=500&minRating=4
app.get("/api/restaurants", async (req, res) => {
  try {
    const city = (req.query.city || "").toString().trim();
    const mealType = (req.query.mealType || "All").toString().trim();
    const maxPrice = Number(req.query.maxPrice || 99999);
    const minRating = Number(req.query.minRating || 0);

    // Build a MongoDB query – only add conditions that are actually set
    const query = {};

    if (city) {
      query.city = { $regex: new RegExp(`^${city}$`, "i") };
    }

    if (mealType && mealType !== "All") {
      query.meal_types = mealType; // Mongoose matches if array contains this value
    }

    query.price_per_person = { $lte: maxPrice };
    query.rating = { $gte: minRating };

    const items = await Restaurant.find(query).lean();

    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch restaurants." });
  }
});

// ─── Feedback ─────────────────────────────────────────────────────────────────
app.post("/api/feedback", async (req, res) => {
  try {
    const email = (req.body.email || "").toString().trim();
    const message = (req.body.message || "").toString().trim();

    if (!email || !message) {
      return res
        .status(400)
        .json({ message: "Email and message are required." });
    }

    if (getMongoStatus()) {
      const saved = await Feedback.create({ email, message });
      return res
        .status(201)
        .json({ message: "Feedback submitted successfully.", id: saved._id });
    }

    // Fallback when MongoDB is not connected
    fallbackFeedbackStore.push({
      id: fallbackFeedbackStore.length + 1,
      email,
      message,
      createdAt: new Date().toISOString(),
    });

    return res
      .status(201)
      .json({ message: "Feedback submitted successfully.", mode: "in-memory" });
  } catch (error) {
    return res.status(500).json({ message: "Could not submit feedback." });
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
