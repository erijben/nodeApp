const config = require("../models/config"); // Utilisation de config au lieu de Config
const Equip = require("../models/equip");
const User = require("../models/user");
module.exports = class configService{
    static async getAllconfigs(){
        try {
            const allconfigs = await  config.find();
            return allconfigs;
        } catch (error) {
            console.log(`Could not fetch configs ${error}`)
        }
    }

    static async checkEmailExists(email)
 {
        try {
            const user = await User.findOne({ email });
            return user !== null; // Si l'utilisateur est trouvé, renvoie true, sinon false
        } catch (error) {
            console.error("Error checking email existence:", error);
            throw error;
        }
    }





    static async createconfig(data) {
        try {
            // Vérifier si la configuration avec l'ID de l'équipement fourni existe
            const existingConfig = await Equip.findById(data.equipment);
            if (!existingConfig) {
                throw new Error("La configuration spécifiée n'existe pas.");
                
            }
            const emailExists = await this.checkEmailExists(data.adresseMail);
            if (!emailExists) {
                throw new Error("L'adresse e-mail spécifiée n'existe pas.");
            }
            const newconfig = {
                Type: data.Type,
                seuil: data.seuil,
                adresseMail: data.adresseMail,
                equipment: data.equipment,
            };
            const response = await new config(newconfig).save(); // Utilisation de config au lieu de Config
            return response;
        } catch (error) {
            console.log("Error creating config:", error);
            throw error;
        }
    }

    static async getconfigbyId(configId){
        try {
            const singleconfigResponse =  await config.findById({_id: configId});
            return singleconfigResponse;
        } catch (error) {
            console.log(`config not found. ${error}`)
        }
    }
    static async updateconfig(configId, updateData) {
        try {
            // Vérifier si l'équipement avec l'ID fourni existe
            if (updateData.equipment) {
                const equip = await Equip.findById(updateData.equipment);
                if (!equip) {
                    throw new Error('L\'équipement spécifié n\'existe pas.');
                }
            }
    
            const updated = await config.findByIdAndUpdate(configId, updateData, { new: true });
            if (!updated) {
                throw new Error('La configuration n\'a pas pu être mise à jour.');
            }
            return updated;
        } catch (error) {
            console.log(`Could not update config ${error}`);
            throw error;
        }
    }


    static async deleteconfig(configId){
        try {
            const deletedResponse = await config.findOneAndDelete(configId);
            return deletedResponse;
        } catch (error) {
            console.log(`Could  ot delete config ${error}`);
        }

    }
}