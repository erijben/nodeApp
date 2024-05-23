const  express =  require("express");
const router = express.Router();
const equipCtrl = require("../controllers/equip.controller");
const Equip = require('../models/equip');


  router.get("/", equipCtrl.apiGetAllequips);
  router.post("/add", equipCtrl.apiCreateequip);
  router.get("/equip/:id", equipCtrl.apiGetequipById);
  router.put("/equip/:id", equipCtrl.apiUpdateequip);
  router.delete('/:id', equipCtrl.apiDeleteequip);
  router.get("/find/:rfid", equipCtrl.apiGetEquipByRfid);
module.exports =  router;