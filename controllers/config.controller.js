const configService = require("../services/configservice");

module.exports = class config{

   static async apiGetAllconfigs(req, res, next){
       try {
         const configs = await configService.getAllconfigs();
         if(!configs){
            res.status(404).json("There are no config published yet!")
         }
         res.json(configs);
       } catch (error) {
          res.status(500).json({error: error})
       }

   }

   static async apiGetconfigById(req, res, next){
      try {
         let id = req.params.id || {};
         const config = await configService.getconfigbyId(id)

;
         res.json(config);
      } catch (error) {
         res.status(500).json({error: error})
      }
   }
   static async apiCreateconfig(req, res, next) {
      try {
          const { Type, seuil, adresseMail, equipment } = req.body;

          // Vérifiez si les champs requis sont présents
          if (!Type || !seuil || !adresseMail || !equipment) {
              return res
                  .status(400)
                  .json({ error: "Missing required fields." });
          }

          const createdconfig = await configService.createconfig({
              Type,
              seuil,
              adresseMail,
              equipment,
          });
          console.log("config created:", createdconfig);
          res.status(201).json(createdconfig); // Utilisez le code de statut 201 pour une création réussie
      } catch (error) {
          console.error("Error creating config:", error);
          res.status(500).json({ error: error.message });
      }
  }

  static async apiUpdateconfig(req, res, next){
   try {
     const configId = req.params.id;
     const updateData = req.body;
 
     const updatedConfig = await configService.updateconfig(configId, updateData);
 
     if(updatedConfig) {
       res.json(updatedConfig);
     } else {
       res.status(404).json({ message: "Configuration not found." });
     }
   } catch (error) {
     console.error(`Could not update config: ${error}`);
     res.status(500).json({ error: error.message });
   }
 }

   static async apiDeleteconfig(req, res, next){
         try {
            const configId = req.params.id;
            const deleteResponse =  await configService.deleteconfig(configId)
            res.json(deleteResponse);
         } catch (error) {
            res.status(500).json({error: error})
         }
   }

}