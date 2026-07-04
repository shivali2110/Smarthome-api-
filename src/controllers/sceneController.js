const prisma = require('../db');

// GET - Saare active scenes
const getAllScenes = async (req, res) => {
    try {
        const scenes = await prisma.scenes.findMany({
            where: { active: true },
            include: { switches: true }
        });
        res.json({ success: true, data: scenes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET - Ek scene by ID
const getSceneById = async (req, res) => {
    try {
        const scene = await prisma.scenes.findFirst({
            where: {
                scene_id: parseInt(req.params.id),
                active: true
            },
            include: { switches: true }
        });
        if (!scene) return res.status(404).json({ success: false, message: 'Scene not found or deleted' });
        res.json({ success: true, data: scene });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST - Naya scene banao
const createScene = async (req, res) => {
    try {
        const { scene_name, scene_type, trigger_switch_id, trigger_pattern } = req.body;

        if (!scene_name || !scene_type || !trigger_switch_id || !trigger_pattern) {
            return res.status(400).json({
                success: false,
                message: 'scene_name, scene_type, trigger_switch_id and trigger_pattern are required'
            });
        }

        const newScene = await prisma.scenes.create({
            data: {
                scene_name,
                scene_type,
                trigger_switch_id: parseInt(trigger_switch_id),
                trigger_pattern,
                active: true
            }
        });
        res.status(201).json({ success: true, message: 'Scene created successfully', data: newScene });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT - Scene update karo
const updateScene = async (req, res) => {
    try {
        const { scene_name, trigger_pattern } = req.body;
        const scene_id = parseInt(req.params.id);

        const existing = await prisma.scenes.findFirst({
            where: { scene_id, active: true }
        });
        if (!existing) return res.status(404).json({ success: false, message: 'Scene not found or deleted' });

        const updated = await prisma.scenes.update({
            where: { scene_id },
            data: {
                scene_name: scene_name || existing.scene_name,
                trigger_pattern: trigger_pattern || existing.trigger_pattern
            }
        });
        res.json({ success: true, message: 'Scene updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE - Soft delete
const deleteScene = async (req, res) => {
    try {
        const scene_id = parseInt(req.params.id);

        const existing = await prisma.scenes.findFirst({
            where: { scene_id, active: true }
        });
        if (!existing) return res.status(404).json({ success: false, message: 'Scene not found or already deleted' });

        await prisma.scenes.update({
            where: { scene_id },
            data: { active: false }
        });
        res.json({ success: true, message: 'Scene has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllScenes, getSceneById, createScene, updateScene, deleteScene };
