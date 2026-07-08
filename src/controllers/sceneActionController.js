const prisma = require('../db');

const getAllSceneActions = async (req, res) => {
    try {
        const actions = await prisma.scene_actions.findMany({
            where: { active: true },
            include: { scenes: true, switches: true }
        });
        res.json({ success: true, data: actions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSceneActionById = async (req, res) => {
    try {
        const action = await prisma.scene_actions.findFirst({
            where: { action_id: parseInt(req.params.id), active: true },
            include: { scenes: true, switches: true }
        });
        if (!action) return res.status(404).json({ success: false, message: 'Scene action not found' });
        res.json({ success: true, data: action });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSceneActionsBySceneId = async (req, res) => {
    try {
        const actions = await prisma.scene_actions.findMany({
            where: { scene_id: parseInt(req.params.sceneId), active: true },
            include: { switches: true }
        });
        res.json({ success: true, data: actions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createSceneAction = async (req, res) => {
    try {
        const { scene_id, target_switch_id, action_status } = req.body;
        if (!scene_id || !target_switch_id || !action_status) {
            return res.status(400).json({ success: false, message: 'scene_id, target_switch_id and action_status are required' });
        }
        const newAction = await prisma.scene_actions.create({
            data: {
                scene_id: parseInt(scene_id),
                target_switch_id: parseInt(target_switch_id),
                action_status,
                active: true
            }
        });
        res.status(201).json({ success: true, message: 'Scene action created successfully', data: newAction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSceneAction = async (req, res) => {
    try {
        const { action_status } = req.body;
        const action_id = parseInt(req.params.id);
        const existing = await prisma.scene_actions.findFirst({ where: { action_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Scene action not found' });
        const updated = await prisma.scene_actions.update({
            where: { action_id },
            data: { action_status }
        });
        res.json({ success: true, message: 'Scene action updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSceneAction = async (req, res) => {
    try {
        const action_id = parseInt(req.params.id);
        const existing = await prisma.scene_actions.findFirst({ where: { action_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Scene action not found' });
        await prisma.scene_actions.update({ where: { action_id }, data: { active: false } });
        res.json({ success: true, message: 'Scene action deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSceneActions, getSceneActionById, getSceneActionsBySceneId, createSceneAction, updateSceneAction, deleteSceneAction };