const express = require('express');
const router = express.Router();
const inventoryCtrl = require("../controllers/inventory.controller");

router.post("/finish", inventoryCtrl.apiFinishInventory);
router.get("/count/:date", inventoryCtrl.apiGetInventoryCountByDate);
router.get("/", inventoryCtrl.apiGetAllInventories);
module.exports = router;