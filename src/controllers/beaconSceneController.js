const prisma = require('../db');

// GET - Saare active beacon scenes
const getAllBeaconScenes = async (req, res) => {
    try {
        const beaconScenes = await prisma.beacon_scenes.findMany({
            where: { active: true },
            include: { switches: true }
        });
        res.json({ success: true, data: beaconScenes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET - Ek beacon scene by ID
const getBeaconSceneById = async (req, res) => {
    try {
        const beaconScene = await prisma.beacon_scenes.findFirst({
            where: {
                beacon_scene_id: parseInt(req.params.id),
                active: true
            },
            include: { switches: true }
        });
        if (!beaconScene) return res.status(404).json({ success: false, message: 'Beacon scene not found or deleted' });
        res.json({ success: true, data: beaconScene });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST - Naya beacon scene banao
const createBeaconScene = async (req, res) => {
    try {
        const { beacon_scene_name, mac_address, trigger_switch_id, trigger_pattern } = req.body;

        if (!beacon_scene_name || !mac_address || !trigger_switch_id || !trigger_pattern) {
            return res.status(400).json({
                success: false,
                message: 'beacon_scene_name, mac_address, trigger_switch_id and trigger_pattern are required'
            });
        }

        const newBeaconScene = await prisma.beacon_scenes.create({
            data: {
                beacon_scene_name,
                mac_address,
                trigger_switch_id: parseInt(trigger_switch_id),
                trigger_pattern,
                active: true
            }
        });
        res.status(201).json({ success: true, message: 'Beacon scene created successfully', data: newBeaconScene });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT - Beacon scene update karo
const updateBeaconScene = async (req, res) => {
    try {
        const { beacon_scene_name, mac_address, trigger_pattern } = req.body;
        const beacon_scene_id = parseInt(req.params.id);

        const existing = await prisma.beacon_scenes.findFirst({
            where: { beacon_scene_id, active: true }
        });
        if (!existing) return res.status(404).json({ success: false, message: 'Beacon scene not found or deleted' });

        const updated = await prisma.beacon_scenes.update({
            where: { beacon_scene_id },
            data: {
                beacon_scene_name: beacon_scene_name || existing.beacon_scene_name,
                mac_address: mac_address || existing.mac_address,
                trigger_pattern: trigger_pattern || existing.trigger_pattern
            }
        });
        res.json({ success: true, message: 'Beacon scene updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE - Soft delete
const deleteBeaconScene = async (req, res) => {
    try {
        const beacon_scene_id = parseInt(req.params.id);

        const existing = await prisma.beacon_scenes.findFirst({
            where: { beacon_scene_id, active: true }
        });
        if (!existing) return res.status(404).json({ success: false, message: 'Beacon scene not found or already deleted' });

        await prisma.beacon_scenes.update({
            where: { beacon_scene_id },
            data: { active: false }
        });
        res.json({ success: true, message: 'Beacon scene has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBeaconScenes, getBeaconSceneById, createBeaconScene, updateBeaconScene, deleteBeaconScene };
