// models/inventory.js
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  scannedEquipmentsCount: {
    type: Number,
    required: true,
  }
});

module.exports = mongoose.model("Inventory", inventorySchema);