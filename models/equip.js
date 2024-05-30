const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const equipSchema = new mongoose.Schema({
  Nom: {
    type: String,
    required: true,
  },
  Type: {
    type: String,
    required: true,
  },
  AdresseIp: {
    type: String,
    required: true,
  },
  RFID: {
    type: String,
    required: true,
  },
  Département: {
    type: String,
    required: true,
  },

  Etat: {
    type: String,
    required: true,
  },

  ConnecteA: [{ type: Schema.Types.ObjectId, ref: 'Equip' }]
});

module.exports = mongoose.model("Equip", equipSchema);