const express = require("express");
const router = express.Router();
const equipCtrl = require("../controllers/equip.controller");
const Equip = require('../models/equip');

router.get("/", equipCtrl.apiGetAllequips);
router.post("/add", (req, res) => {
  equipCtrl.apiCreateequip(req, res);
});

router.get("/equip/:id", equipCtrl.apiGetequipById);
router.put("/equip/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedEquip = await Equip.findByIdAndUpdate(id, { $addToSet: { ConnecteA: updateData.ConnecteA } }, { new: true }).populate("ConnecteA");
    if (!updatedEquip) {
      return res.status(404).json({ message: "Équipement non trouvé" });
    }

    res.json(updatedEquip);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'équipement:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.delete('/:id', equipCtrl.apiDeleteequip);
router.get("/find/:rfid", equipCtrl.apiGetEquipByRfid);

module.exports = router;
