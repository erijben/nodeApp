const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const latencyAnalysisResultSchema = new Schema({
  equipmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Equip', // Remplacez 'Equip' par le nom correct de votre modèle d'équipement
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  maxAcceptableLatency: {
    type: Number,
    required: true,
  },
  acceptableTimeRange: {
    type: Number,
    required: true,
  },
  abnormalTimeThreshold: {
    type: Number,
    required: true,
  },
  numberOfPings: {
    type: Number,
    required: true,
  },
  checkFrequency: {
    type: String,
    required: true,
  },
  abnormalLatencies: [
    {
      timestamp: {
        type: Date,
        required: true,
      },
      temps: {
        type: Number,
        required: true,
      },
    },
  ],
});

const LatencyAnalysisResult = mongoose.model("LatencyAnalysisResult", latencyAnalysisResultSchema);

module.exports = LatencyAnalysisResult;
