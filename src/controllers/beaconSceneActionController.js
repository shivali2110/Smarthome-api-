const prisma = require('../db');

const getAllBeaconSceneActions = async (req, res) => {
    try {
        const actions = await prisma.beacon_scene_actions.findMany({
            where: { active: true },
            include: { beacon_scenes: true, switches: true }
        });
        res.json({ success: true, data: actions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBeaconSceneActionsByBeaconSceneId = async (req, res) => {
    try {
        const actions = await prisma.beacon_scene_actions.findMany({
            where: { beacon_scene_id: parseInt(req.params.beaconSceneId), active: true },
            include: { switches: true }
        });
        res.json({ success: true, data: actions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createBeaconSceneAction = async (req, res) => {
    try {
        const { beacon_scene_id, target_switch_id, action_status } = req.body;
        if (!beacon_scene_id || !target_switch_id || !action_status) {
            return res.status(400).json({ success: false, message: 'beacon_scene_id, target_switch_id and action_status are required' });
        }
        const newAction = await prisma.beacon_scene_actions.create({
            data: {
                beacon_scene_id: parseInt(beacon_scene_id),
                target_switch_id: parseInt(target_switch_id),
                action_status,
                active: true
            }
        });
        res.status(201).json({ success: true, message: 'Beacon scene action created successfully', data: newAction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateBeaconSceneAction = async (req, res) => {
    try {
        const { action_status } = req.body;
        const action_id = parseInt(req.params.id);
        const existing = await prisma.beacon_scene_actions.findFirst({ where: { action_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Beacon scene action not found' });
        const updated = await prisma.beacon_scene_actions.update({ where: { action_id }, data: { action_status } });
        res.json({ success: true, message: 'Beacon scene action updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteBeaconSceneAction = async (req, res) => {
    try {
        const action_id = parseInt(req.params.id);
        const existing = await prisma.beacon_scene_actions.findFirst({ where: { action_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Beacon scene action not found' });
        await prisma.beacon_scene_actions.update({ where: { action_id }, data: { active: false } });
        res.json({ success: true, message: 'Beacon scene action deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBeaconSceneActions, getBeaconSceneActionsByBeaconSceneId, createBeaconSceneAction, updateBeaconSceneAction, deleteBeaconSceneAction };
