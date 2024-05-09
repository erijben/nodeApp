const mongoose = require("mongoose");

const configSchema = new mongoose.Schema({
  Type: {
    type: String,
    required: true,
  },
  seuil: {
    type: String,
    required: true,
  },
 
  adresseMail: {
    type: String,
    required:true,
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equip', // Reference to the Equip model
    required: true,
    validate: {
        validator: async function (value) {
            const equip = await mongoose.model('Equip').findById(value);
            return equip !== null;
        },
        message: 'L\'équipement spécifié n\'existe pas.',
    },
},
});

module.exports = mongoose.model("Config", configSchema);