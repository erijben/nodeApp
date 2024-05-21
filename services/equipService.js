const equip = require("../models/equip");
const cron = require('node-cron');

module.exports = class equipService {
    
    static async getAllequips() {
        try {
            const allequip = await equip.find();
            return allequip;
        } catch (error) {
            console.log(`Could not fetch equips ${error}`);
        }
    }

    static async createequip(data) {
        try {
            const newequip = {
                Nom :data.Nom,
                Type :data.Type,
                AdresseIp : data.AdresseIp,
                Emplacement :data.Emplacement,
                Etat :data.Etat,
              
                RFID:data.RFID,
              
            };
            const response = await new equip(newequip).save();
            return response;
        } catch (error) {
            console.log(error);
        } 
    }

          static async getequipbyId(equipId) {
            try {
                const singleequipResponse = await equip.findById({ _id: equipId });
                return singleequipResponse;
            } catch (error) {
                console.log(`equip not found. ${error}`);
            }
        }
        static async getEquipByName(Nom) {
            try {
                const equipByName = await equip.findOne({ Nom: Nom });
                return equipByName;
            } catch (error) {
                console.log(`Could not fetch equip by name ${error}`);
                throw error;
            }
        }
        static async getEquipByIp(ip) {
            try {
                const equipByIp = await equip.findOne({ AdresseIp: ip });
                return equipByIp;
            } catch (error) {
                console.log(`Could not fetch equip by IP ${error}`);
            }
        }
        static async getEquipByRfid(RFID) {
            try {
                const equipByRfid = await equip.findOne({ RFID: RFID });
                return equipByRfid;
            } catch (error) {
                console.log(`Could not fetch equip by RFID ${error}`);
                throw error;
            }
        }
        static async updateequip(id, updateData) {
            try {
                // Check if an equipment with the same name exists
                const existingEquipByName = await equip.findOne({ Nom: updateData.Nom });
                if (existingEquipByName && existingEquipByName._id.toString() !== id) {
                    console.log(`Équipement avec le nom déjà existant: ${updateData.Nom}`);
                    throw new Error(`Équipement déjà existant avec le nom: ${updateData.Nom}`);
                }
        
                // Check if an equipment with the same IP address exists
                const existingEquipByIp = await equip.findOne({ AdresseIp: updateData.AdresseIp });
                if (existingEquipByIp && existingEquipByIp._id.toString() !== id) {
                    console.log(`Équipement avec l'adresse IP déjà existante: ${updateData.AdresseIp}`);
                    throw new Error(`Équipement déjà existant avec l'adresse IP: ${updateData.AdresseIp}`);
                }
        
                // Check if an equipment with the same RFID exists
                const existingEquipByRfid = await equip.findOne({ RFID: updateData.RFID });
                if (existingEquipByRfid && existingEquipByRfid._id.toString() !== id) {
                    console.log(`Équipement avec le RFID déjà existant: ${updateData.RFID}`);
                    throw new Error(`Équipement déjà existant avec le RFID: ${updateData.RFID}`);
                }
        
                const updated = await equip.findOneAndUpdate({ _id: id }, updateData, { new: true });
                if (!updated) {
                    console.log(`No equipment found with ID ${id}`);
                    return null;
                }
                return updated;
            } catch (error) {
                console.error('Error in updateequip:', error);
                throw error;
            }
        }
    
    static async deleteequip(equipId) {
        try {
            const deletedResponse = await equip.findOneAndDelete({ _id: equipId });
            return deletedResponse;
        } catch (error) {
            console.log(`Could not delete equip ${error}`);
            throw error; // Rethrow the error to handle it in the calling code
        }
    }};  
