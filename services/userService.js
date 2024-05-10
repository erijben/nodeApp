const User = require("../models/user");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

module.exports = class UserService{
    static generatePassword() {
        const password = crypto.randomBytes(8).toString('hex'); // Génère un mot de passe de 16 caractères
        return password;
    }
    static async getAllUsers(){
        try {
            const allUsers = await User.find();
            return allUsers;
        } catch (error) {
            console.log(`Could not fetch Users ${error}`)
        }
    }

    static async createUser(data){
        try {
             const plainPassword = this.generatePassword(); // Générer un mot de passe en clair
             const hashedPassword = await bcrypt.hash(plainPassword, 10); // Hasher le mot de passe

            const newUser = new User({
                username: data.username,
                email: data.email,
                number: data.number,
                role: data.role,
                password: hashedPassword 
                
            });
            await newUser.save();
             // Envoyer l'email avec le mot de passe en clair
        await this.sendResetPasswordEmail(newUser, plainPassword);

        return newUser;

       
        } catch (error) {
            console.log(`Could not create user ${error}`);
            throw error; // Pour permettre au contrôleur de gérer l'erreur
        }
    }

    static async getUserbyId(UserId){
        try {
            const singleUserResponse = await User.findById({_id: UserId});
            return singleUserResponse;
        } catch (error) {
            console.log(`User not found. ${error}`)
        }
    }

    static async updateUser(userId, updateData) {
        try {
          if (updateData.password) {
            // Hasher le mot de passe s'il est présent
            const hashedPassword = await bcrypt.hash(updateData.password, 10);
            updateData.password = hashedPassword;
          }
          const updateResponse = await User.findByIdAndUpdate(userId, updateData, { new: true });
          return updateResponse;
        } catch (error) {
          console.log(`Could not update user ${error}`);
          throw error;
        }
      }
      
    static async deleteUser(UserId){
        try {
            const deletedResponse = await User.findByIdAndDelete(UserId);
            return deletedResponse;
        } catch (error) {
            console.log(`Could not delete user ${error}`);
            throw error;
        }
    }

    static async getUserByEmailOrNumber(email, number) {
        try {
            const user = await User.findOne({ $or: [{ email: email }, { number: number }] });
            return user;
        } catch (error) {
            console.error(`Error finding user by email or number: ${error}`);
            throw error;
        }
    }

    // Ajout de la fonction sendResetPasswordEmail ici pour une meilleure organisation
    static async sendResetPasswordEmail(user, plainPassword) {
        
        

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'erijbenamor6@gmail.com', // Remplacez par votre adresse e-mail Gmail réelle
                pass: 'jvpk gsdc nlhm ldbg'    
            }
        });
       
        const mailOptions = {
            from: 'erijbenamor6@gmail.com', // Assurez-vous que cette adresse est correcte et configurée dans votre compte Gmail
            to: user.email,
            subject: 'Your account has been created',
            text: `Your password is: ${plainPassword}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                throw error; // Pour permettre au contrôleur de gérer l'erreur
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }
}