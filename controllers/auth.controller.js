require('dotenv').config()
const JWT = require("jsonwebtoken")
const bcrypt = require('bcryptjs');
const User= require("../models/user");
const nodemailer = require('nodemailer');
const crypto = require('crypto');

async function signUp(req, res) {
    try {
        const { username, email, password } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ message: "missing statment" });
        }
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: "User with this email/username already exists" });
        }
        const crytptedPass  = await bcrypt.hash(password, 10);
        console.log(password)
        console.log(crytptedPass)
        const newUser = new User({ username, email, password: crytptedPass });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
       console.log(savedUser)
    } catch (err) {
        res.status(500).json(err)
        console.log(err)
    }
}

async function Login(req, res) {
    try {
        console.log("Attempting login for:", req.body.email);
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            console.log("No user found with that email");
            return res.status(401).json("Wrong credentials - User not found");
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isMatch) {
            console.log("Password does not match");
            return res.status(401).json("Wrong credentials - Incorrect password");
        }

        console.log("User role before token:", user.role); // Check user role
      // Création du token incluant l'ID de l'utilisateur et son rôle
      const accessToken = JWT.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET, { expiresIn: '3d' });

        console.log("Login successful for user:", user.username, "with role:", user.role);
   // Renvoi du token et des informations utilisateur nécessaires (sans le mot de passe)
        res.status(200).json({
            message: "Login successful",
            accessToken,
            user: { id: user._id, username: user.username, role: user.role }
        });
    } catch (err) {
        console.error("Error while logging in:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
async function forgotPassword  (req, res)  {
    const { email } = req.body;
    try {
        console.log("Forgot Password function called");
        console.log("Received email:", email);
        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet e-mail." });
        }

        // Générer un jeton de réinitialisation du mot de passe et la date d'expiration
        const resetToken = crypto.randomBytes(20).toString('hex');
        console.log("Reset token:", resetToken);
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 heure

        await user.save();

        // Configuration de l'envoi de mail
        const transporter = nodemailer.createTransport({
            service: 'gmail', // ou autre service
            auth: {
                user:'erijbenamor6@gmail.com',
                pass: 'jvpk gsdc nlhm ldbg'    ,
            
            }
        });

        const resetUrl = `token=${resetToken}`;
        const mailOptions = {
            from: 'erijbenamor6@gmail.com',
            to: user.email,
            subject: 'Réinitialisation de mot de passe',
            text: ` ${resetUrl}`
        };

        // Envoi de l'e-mail
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Un e-mail de réinitialisation de mot de passe a été envoyé." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Fonction resetPassword
async function resetPassword  (req, res)  {
    const { token, newPassword } = req.body;
    try {
        console.log("Reset Password function called");
        console.log("Received token:", token);
        // Vérifier le jeton et la date d'expiration
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Jeton de réinitialisation invalide ou expiré." });
        }

        // Réinitialiser le mot de passe
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
module.exports = {
    signUp,
    Login,
    forgotPassword,
    resetPassword
};