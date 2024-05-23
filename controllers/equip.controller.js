const equipService = require("../services/equipService");
const { isValidIPv4 } = require('net');

module.exports = class equip {


    static async apiGetEquipByRfid(req, res) {
        try {
          const rfid = req.params.rfid;
          const equip = await equipService.getEquipByRfid(rfid);
          if (equip) {
            res.json({ success: true, equipment: equip });
          } else {
            res.json({ success: false, message: "Équipement non trouvé" });
          }
        } catch (error) {
          console.error("Erreur lors de la recherche de l'équipement :", error);
          res.status(500).json({ success: false, message: "Erreur du serveur" });
        }
      }

    static async apiGetAllequips(req, res, next) {
        try {
            const equips = await equipService.getAllequips();
            if (!equips) {
                res.status(404).json("There are no equip published yet!");
            }
            res.json(equips);
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }
    static async apiGetequipById(req, res, next) {
        try {
            let id = req.params.id || {};
            console.log('Fetching equipment with ID:', id); // Ajout de ce log
            const equip = await equipService.getequipbyId(id)
;
            console.log('Fetched equipment data:', equip); // Ajout de ce log
            res.json(equip);
        } catch (error) {
            console.error('Error fetching equipment data:', error); // Ajout de ce log
            res.status(500).json({ error: error });
        }
    };
    
    
    static async apiCreateequip(req, res, next) {
        try {
            const existingEquipByIp = await equipService.getEquipByIp(req.body.AdresseIp);
            const existingEquipByRfid = await equipService.getEquipByRfid(req.body.RFID);
            const existingEquipByName = await equipService.getEquipByName(req.body.Nom);
    
            if (existingEquipByIp || existingEquipByRfid || existingEquipByName) {
                // Si l'équipement existe déjà, renvoyer un statut d'erreur
                return res.status(400).json({ success: false, message: "Équipement déjà existant" });
            }
    
            // Validation de l'adresse IP
            const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            if (!ipRegex.test(req.body.AdresseIp)) {
                return res.status(400).json({ success: false, message: "Format d'adresse IP invalide." });
            }
    
            const comment = {
                Nom: req.body.Nom,
                Type: req.body.Type,
                AdresseIp: req.body.AdresseIp,
                Emplacement: req.body.Emplacement,
                Etat: req.body.Etat,
                RFID: req.body.RFID,
            };
    
            console.log("Création d'un nouvel équipement :", comment);
            const updatedequip = await equipService.createequip(comment);
            console.log("Équipement ajouté avec succès :", updatedequip);
            res.status(200).json({ success: true, message: "Équipement ajouté avec succès", data: updatedequip });
        } catch (error) {
            console.error('Erreur lors de la création de l\'équipement :', error);
            res.status(500).json({ success: false, message: "Erreur lors de l'ajout de l'équipement. Veuillez réessayer plus tard." });
        }
    }

    static async apiUpdateequip(req, res) {
        try {
            const equipId = req.params.id;
            const updateData = req.body;
    
            // Check if an equipment with the same name exists
            const existingEquipByName = await equipService.getEquipByName(updateData.Nom);
            if (existingEquipByName && existingEquipByName._id.toString() !== equipId) {
                return res.status(400).json({ success: false, message: `Équipement déjà existant avec le nom: ${updateData.Nom}.` });
            }
    
            // Check if an equipment with the same IP address exists
            const existingEquipByIp = await equipService.getEquipByIp(updateData.AdresseIp);
            if (existingEquipByIp && existingEquipByIp._id.toString() !== equipId) {
                return res.status(400).json({ success: false, message: `Équipement déjà existant avec l'adresse IP: ${updateData.AdresseIp}.` });
            }
    
            // Check if an equipment with the same RFID exists
            const existingEquipByRfid = await equipService.getEquipByRfid(updateData.RFID);
            if (existingEquipByRfid && existingEquipByRfid._id.toString() !== equipId) {
                return res.status(400).json({ success: false, message: `Équipement déjà existant avec le RFID: ${updateData.RFID}.` });
            }
    
            // Validation de l'adresse IP lors de la mise à jour
            const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            if (!ipRegex.test(updateData.AdresseIp)) {
                return res.status(400).json({ success: false, message: "Format d'adresse IP invalide." });
            }
            const updatedEquip = await equipService.updateequip(equipId, updateData);
            if (!updatedEquip) {
              return res.status(404).json({ success: false, message: "Aucun équipement trouvé avec l'ID fourni." });
            }
            res.json({ success: true, message: "Équipement mis à jour avec succès.", data: updatedEquip });
          } catch (error) {
            res.status(500).json({ error: error.message });
          }
        }


    static async apiDeleteequip(req, res, next) {
        try {
            const equipId = req.params.id;
            console.log('Deleting equipment with ID:', equipId);
    
            const deletedResponse = await equipService.deleteequip(equipId);
    
            console.log('Equipment deleted successfully:', deletedResponse);
            res.json(deletedResponse);
        } catch (error) {
            console.error('Error deleting equipment:', error);
            res.status(500).json({ error: error });
        }
    }
    
};