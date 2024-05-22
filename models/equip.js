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
    required: false,
  },
  RFID: {
    type: String,
    required: false,
  },
  Emplacement: {
    type: String,
    required: false,
  },
  Etat: {
    type: String,
    required: false,
  },

  ConnecteA: [{ type: Schema.Types.ObjectId, ref: 'Equip' }]
});

module.exports = mongoose.model("Equip", equipSchema);