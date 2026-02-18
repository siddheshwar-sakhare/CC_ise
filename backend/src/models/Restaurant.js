const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    meal_types: {
      type: [String], // e.g. ["Breakfast", "Lunch", "Dinner"]
      required: true,
    },
    cuisines: {
      type: [String], // e.g. ["Indian", "Chinese"]
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    price_per_person: {
      type: Number,
      required: true,
    },
    addr: {
      type: String,
      required: true,
      trim: true,
    },
    img: {
      type: String, // Cloudinary URL
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

// Index for fast filtered queries
restaurantSchema.index({ city: 1, rating: 1, price_per_person: 1 });

module.exports = mongoose.model("Restaurant", restaurantSchema);
