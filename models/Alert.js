
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equip' },
  interventionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intervention' },
  status: { type: String, enum: ['dysfonctionnel', 'Problème de réseau','En bon état'] },
  resolved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
