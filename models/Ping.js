const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const isValidDate = (value) => !isNaN(new Date(value).getTime());

const pingResult = new Schema({
  equipment: {
    type: Schema.Types.ObjectId,
    ref: 'Equip', // Use the correct model name here
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  TTL: {
    type: [Number],
    required: true,
  },
  latency: {
    type: [Number],
    required: true,
  },

  packetsSent: {
    type: Number,
    required: true,
  },
  packetsReceived: {
    type: Number,
    required: true,
  },
  packetsLost: {
    type: Number,
    required: true,
  },
  minimumTime: {
    type: Number,
    required: true,
  },
  maximumTime: {
    type: Number,
    required: true,
  },
  averageTime: {
    type: Number,
    required: true,
  },


  timestamp: {
    type: Date,
    required: true,
    validate: {
      validator: isValidDate,
      message: 'Invalid date format for timestamp.',
    },
  },
  
  success: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("PingResult", pingResult);
