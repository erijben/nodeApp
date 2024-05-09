const Intervention = require("../models/intervention");
const eventEmitter = require('./event-emitter');

module.exports = class InterventionService {
    static async getAllInterventions() {
        try {
            return await Intervention.find();
        } catch (error) {
            console.log(`Could not fetch interventions: ${error}`);
            throw error;
        }
    }

    static async createIntervention(data) {
        try {
            data.parentIntervention = data.parentIntervention === "" ? null : data.parentIntervention;
            const newIntervention = new Intervention(data);
            const response = await newIntervention.save();
            console.log('Intervention created with ID:', response._id);
            setTimeout(() => {
                eventEmitter.emit('evaluateEquipment', response._id);
            }, 180000); // 3 minutes
            return response;
        } catch (error) {
            console.log('Error creating intervention:', error);
            throw error;
        }
    }

    static async getInterventionById(interventionId) {
        try {
            return await Intervention.findById(interventionId);
        } catch (error) {
            console.log(`Intervention not found: ${error}`);
            throw error;
        }
    }

    static async updateIntervention(interventionId, updateData) {
        try {
            updateData.date = new Date(); // Always update the date to now on update
            return await Intervention.updateOne({ _id: interventionId }, { $set: updateData });
        } catch (error) {
            console.log(`Could not update intervention: ${error}`);
            throw error;
        }
    }

    static async deleteIntervention(interventionId) {
        try {
            return await Intervention.findByIdAndDelete(interventionId);
        } catch (error) {
            console.log(`Could not delete intervention: ${error}`);
            throw error;
        }
    }

    static async getInterventionsByEquipment(equipmentIds) {
        try {
            return await Intervention.find({ equipment: { $in: equipmentIds } });
        } catch (error) {
            console.error(`Error fetching interventions by equipment: ${error.message}`);
            throw error;
        }
    }
};
