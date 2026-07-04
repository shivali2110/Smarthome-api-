const prisma = require('../db');

const getAllBeacons = async (req, res) => {
    try {
        const beacons = await prisma.beacon_list.findMany({ where: { active: true } });
        res.json({ success: true, data: beacons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBeaconById = async (req, res) => {
    try {
        const beacon = await prisma.beacon_list.findFirst({
            where: { beacon_id: parseInt(req.params.id), active: true }
        });
        if (!beacon) return res.status(404).json({ success: false, message: 'Beacon not found or deleted' });
        res.json({ success: true, data: beacon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createBeacon = async (req, res) => {
    try {
        const { mac_id } = req.body;
        if (!mac_id) return res.status(400).json({ success: false, message: 'mac_id is required' });
        const existing = await prisma.beacon_list.findFirst({ where: { mac_id } });
        if (existing) return res.status(400).json({ success: false, message: 'Beacon with this MAC ID already exists' });
        const newBeacon = await prisma.beacon_list.create({
            data: { mac_id, active: true }
        });
        res.status(201).json({ success: true, message: 'Beacon created successfully', data: newBeacon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateBeacon = async (req, res) => {
    try {
        const { mac_id } = req.body;
        const beacon_id = parseInt(req.params.id);
        const existing = await prisma.beacon_list.findFirst({ where: { beacon_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Beacon not found or deleted' });
        const updated = await prisma.beacon_list.update({ where: { beacon_id }, data: { mac_id } });
        res.json({ success: true, message: 'Beacon updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteBeacon = async (req, res) => {
    try {
        const beacon_id = parseInt(req.params.id);
        const existing = await prisma.beacon_list.findFirst({ where: { beacon_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Beacon not found or already deleted' });
        await prisma.beacon_list.update({ where: { beacon_id }, data: { active: false } });
        res.json({ success: true, message: 'Beacon has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBeacons, getBeaconById, createBeacon, updateBeacon, deleteBeacon };
