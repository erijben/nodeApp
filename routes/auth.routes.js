const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const JWT = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const authMiddleware = require("../middlewares/checkAuth");

// Renommez 'controtller' en 'controller' ici pour corriger l'orthographe
const controller = require('../controllers/auth.controller');


// Utilisez maintenant 'controller' au lieu de 'controtller'
router.post('/signup', controller.signUp);
router.post('/login', controller.Login);
router.get("/all", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Corrigez les noms de fonctions en utilisant 'controller' au lieu de 'auth.controller'
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
module.exports = router;