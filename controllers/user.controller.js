const UserService = require('../services/userService'); 

module.exports = class User{

   static async apiGetAllUsers(req, res, next){
       try {
         const Users = await UserService.getAllUsers();
         if(!Users){
            res.status(404).json("There are no User published yet!")
         }
         res.json(Users);
       } catch (error) {
          res.status(500).json({error: error})
       }
   }

   static async apiGetUserById(req, res, next){
      try {
         let id = req.params.id || {};
         const User = await UserService.getUserbyId(id)


;
         res.json(User);
      } catch (error) {
         res.status(500).json({error: error})
      }
   }

   static async apiCreateUser(req, res, next) {
      try {
          const { username, email, number, role } = req.body;
    
          // Vérifier si un utilisateur avec le même email ou le même numéro existe déjà
          const existingUser = await UserService.getUserByEmailOrNumber(email, number);
          if (existingUser) {
              return res.status(400).json({ error: "Un utilisateur avec cet email ou ce numéro existe déjà." });
          }
    
          // Créez l'utilisateur, puis envoyez l'e-mail
          const createdUser = await UserService.createUser({ username, email, number, role });
          console.log("User created:", createdUser); // Cette ligne reste ici
    
          // Après avoir créé l'utilisateur, envoyez-lui un e-mail pour initialiser son mot de passe
         
    
          res.json(createdUser);
      } catch (error) {
          console.error('Error creating user:', error);
          res.status(500).json({ error: error.message });
      }
    }
    
    static async apiUpdateUser(req, res, next) {
      try {
        const userId = req.params.id;
        const updateData = req.body;
        const updatedUser = await UserService.updateUser(userId, updateData);
    
        if (!updatedUser) {
          throw new Error("Unable to update User, error occurred");
        }
    
        res.json(updatedUser);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }

   static async apiDeleteUser(req, res, next){
         try {
            const UserId = req.params.id;
            const deleteResponse =  await UserService.deleteUser(UserId)
            res.json(deleteResponse);
         } catch (error) {
            res.status(500).json({error: error})
         }
   }

}