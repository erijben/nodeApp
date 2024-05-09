const express = require("express");
const router = express.Router();
const configCtrl = require("../controllers/config.controller");
const Config = require ("../models/config")

router.get('/', async (req, res) => {
    try {
      const configs = await Config.find();
      res.json(configs);
    } catch (error) {
      console.error('Erreur lors de la récupération des configurations :', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });
  
router.post("/configs", configCtrl.apiCreateconfig);
router.get("/configs/:id", configCtrl.apiGetconfigById);
router.put("/configs/:id", configCtrl.apiUpdateconfig);
router.delete("/configs/:id", configCtrl.apiDeleteconfig);

module.exports = router;