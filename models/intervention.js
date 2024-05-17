const mongoose = require("mongoose");
const isValidDate = (value) => !isNaN(new Date(value).getTime());
const interventionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equip', // Reference to the Equip model
        required: [true, 'Le champ "equipment" est obligatoire.'],
        validate: {
            validator: async function (value) {
                const equip = await mongoose.model('Equip').findById(value);
                return equip !== null;
            },
            message: 'L\'équipement spécifié n\'existe pas.',
        },
    },
    date: {
      
            type: Date,
            required: true,
            validate: {
              validator: isValidDate,
              message: 'Invalid date format ',
            },
    },
  
      
    parentIntervention: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Intervention',
        required: false, // Seulement pour les interventions de suivi
        default: null
      },

});

module.exports = mongoose.model('Intervention', interventionSchema);
