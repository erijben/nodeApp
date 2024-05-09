const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    number:{
        type: String,
        required: true,
        unique: true

    },
    role: {
        type: String,
        enum: ["admin", "adminSystem", "technicienReseau"],
        default: "technicienReseau"
    },
    password: {
        type: String,
        required: false
    },
    resetPasswordToken: String, // Champ pour stocker le token de réinitialisation
    resetPasswordExpires: Date, // Champ pour stocker la date d'expiration du token
});


module.exports = mongoose.model('User', userSchema);