const latence = require("../models/latence");

module.exports = class latenceService{
    static async getAlllatences(){
        try {
            const alllatences = await  latence.find();
            return alllatences;
        } catch (error) {
            console.log(`Could not fetch latences ${error}`)
        }
    }

    static async createlatence(data){
        try {

            const newlatence = {
                latencename: data.latencename,
                email: data.email,
                number:data.number
               
            }
           const response = await new latence(newlatence).save();
           return response;
        } catch (error) {
            console.log(error);
        } 

    }
    static async getlatencebyId(latenceId){
        try {
            const singlelatenceResponse =  await latence.findById({_id: latenceId});
            return singlelatenceResponse;
        } catch (error) {
            console.log(`latence not found. ${error}`)
        }
    }

    static async updatelatence(latencename,email,number){
        try {
            const updateResponse =  await latence.updateOne(
                {latencename,email,number}, 
                );

                return updateResponse;
        } catch (error) {
            console.log(`Could not update personneagee ${error}` );

    }
}

    static async deletelatence(latenceId){
        try {
            const deletedResponse = await latence.findOneAndDelete(latenceId);
            return deletedResponse;
        } catch (error) {
            console.log(`Could  ot delete latence ${error}`);
        }

    }
}