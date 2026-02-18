/**
 * Seed script — run once to populate the restaurants collection.
 *
 *   node src/seed.js
 *
 * Reads MONGO_URI from the .env file in the backend root.
 * Images should later be updated to Cloudinary URLs via MongoDB Compass or
 * another script once you upload them to Cloudinary.
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const { ALL_RESTAURANTS } = require("./data/restaurants");
const Restaurant = require("./models/Restaurant");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌  MONGO_URI is not set. Make sure backend/.env exists.");
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅  MongoDB connected:", MONGO_URI);

    const deleted = await Restaurant.deleteMany({});
    console.log(`🗑   Cleared ${deleted.deletedCount} existing restaurant(s).`);

    const inserted = await Restaurant.insertMany(ALL_RESTAURANTS, {
      ordered: false, // continue even if one doc fails validation
    });
    console.log(`🚀  Inserted ${inserted.length} restaurant(s) successfully.`);

    console.log(
      "\n📝  NOTE: The 'img' field currently holds placeholder/original URLs.",
      "\n    After uploading images to Cloudinary, update each document's 'img'",
      "\n    field with the corresponding Cloudinary URL.",
    );
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌  Connection closed.");
  }
}

seed();
