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
router.put("/equip/:id/removeConnection", equipCtrl.apiRemoveConnection);

module.exports =  router;