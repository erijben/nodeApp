const equipService = require("../services/equipService");

module.exports = class equip {

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
     static async getEquipByRfid(RFID) {
            try {
                const equipByRfid = await equip.findOne({ RFID: RFID });
                return equipByRfid;
            } catch (error) {
                console.log(`Could not fetch equip by RFID ${error}`);
                throw error;
            }
        }
    
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

          
    static async apiCreateequip(req, res, next) {
        try {
            const existingEquipByIp = await equipService.getEquipByIp(req.body.AdresseIp);
            const existingEquipByRfid = await equipService.getEquipByRfid(req.body.RFID);
            const existingEquipByName = await equipService.getEquipByName(req.body.Nom); // Nouvelle vérification
    if (existingEquipByIp || existingEquipByRfid ||  existingEquipByName) {
      // Si l'équipement existe déjà, renvoyer un statut d'erreur
      return res.status(400).json({ success: false, message: "Equipement déjà existant" });
    }

     if (existingEquipByName) {
            console.log(`Équipement avec le nom déjà existant: ${req.body.Nom}`); // Log spécifique si le nom existe déjà
            return res.status(400).json({ success: false, message: `Équipement déjà existant avec le nom: ${req.body.Nom}.` });
        }
            const comment = {
                Nom: req.body.Nom,
                Type: req.body.Type,
                AdresseIp: req.body.AdresseIp,
                Emplacement: req.body.Emplacement,
                Etat: req.body.Etat,
                ConnecteA:req.body.ConnecteA,
                RFID:req.body.RFID,
               
            };
    
            console.log("Création d'un nouvel équipement :", comment); // Ajout du log
    
            const updatedequip = await equipService.createequip(comment);
    
            console.log("Équipement ajouté avec succès :", updatedequip); // Ajout du log
    
            // Si l'équipement est créé avec succès, renvoyer un statut de succès
            res.status(200).json({ success: true, message: "Equipement ajouté avec succès", data: updatedequip });
        } catch (error) {
            console.error('Erreur lors de la création de l\'équipement :', error);
            // Si une erreur se produit, renvoyer un statut d'erreur
            res.status(500).json({ success: false, message: "Erreur lors de l'ajout de l'équipement. Veuillez réessayer plus tard." });
        }
    }

    static async apiUpdateequip(req, res) {
        try {
            const equipId = req.params.id;
            const updateData = req.body;
            
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