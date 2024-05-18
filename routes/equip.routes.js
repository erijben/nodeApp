const  express =  require("express");
const router = express.Router();
const equipCtrl = require("../controllers/equip.controller");


router.get("/", equipCtrl.apiGetAllequips);
router.post("/add", (req, res) => {
  console.log("POST request to add");
  equipCtrl.apiCreateequip(req, res);});
   
  router.get("/equip/:id", equipCtrl.apiGetequipById);
  router.put("/equip/:id", equipCtrl.apiUpdateequip);

router.delete('/:id', equipCtrl.apiDeleteequip);
router.get("/find/:rfid", equipCtrl.apiGetEquipByRfid);

// Nouvelle route pour les équipements scannés
router.get("/scanned", async (req, res) => {
  try {
    const scannedEquipments = await equip.find({ isScanned: true });
    res.json(scannedEquipments);
  } catch (error) {
    console.error('Error fetching scanned equipments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports =  router;