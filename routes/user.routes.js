const express = require("express");
const router = express.Router();
const UserCtrl = require("../controllers/user.controller");

router.get("/users", UserCtrl.apiGetAllUsers);
router.post("/users", UserCtrl.apiCreateUser);
router.get("/users/:id", UserCtrl.apiGetUserById);
router.put("/users/:id", UserCtrl.apiUpdateUser);
router.delete("/users/:id", UserCtrl.apiDeleteUser);

module.exports = router;
