// controllers/inventory.controller.js
const Inventory = require("../models/inventory");

module.exports = class inventory {
    static async apiFinishInventory(req, res) {
        try {
            const { scannedEquipments } = req.body;

            const newInventory = new Inventory({
                scannedEquipmentsCount: scannedEquipments.length,
            });

            await newInventory.save();
            res.status(200).json({ success: true, message: "Inventaire terminé avec succès", count: scannedEquipments.length });
        } catch (error) {
            console.error('Erreur lors de la terminaison de l\'inventaire:', error);
            res.status(500).json({ success: false, message: "Erreur du serveur" });
        }
    }

    static async apiGetInventoryCountByDate(req, res) {
        try {
            const { date } = req.params;
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            const inventories = await Inventory.find({
                date: { $gte: startDate, $lt: endDate }
            });

            const count = inventories.reduce((sum, inventory) => sum + inventory.scannedEquipmentsCount, 0);

            res.status(200).json({ success: true, count });
        } catch (error) {
            console.error('Erreur lors de la récupération du compte des inventaires:', error);
            res.status(500).json({ success: false, message: "Erreur du serveur" });
        }
    }
    static async apiGetAllInventories(req, res) {
        try {
            const inventories = await Inventory.find().sort({ date: -1 });
            res.status(200).json(inventories);
        } catch (error) {
            console.error('Erreur lors de la récupération des inventaires:', error);
            res.status(500).json({ success: false, message: "Erreur du serveur" });
        }
    }
}