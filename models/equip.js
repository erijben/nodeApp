const mongoose = require("mongoose");

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

  ConnecteA: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equip'
  }],
  
  Pays: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{2}$/.test(v); // Valide que le code pays est bien deux lettres majuscules
      },
      message: props => `${props.value} n'est pas un code pays valide ISO 3166-1 alpha-2`
    }
  },
});

module.exports = mongoose.model("Equip", equipSchema);