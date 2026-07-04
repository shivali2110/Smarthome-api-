const prisma = require('../db');

const getAllSwitchTypes = async (req, res) => {
    try {
        const types = await prisma.switch_types.findMany({ where: { active: true } });
        res.json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSwitchTypeById = async (req, res) => {
    try {
        const type = await prisma.switch_types.findFirst({
            where: { type_id: parseInt(req.params.id), active: true }
        });
        if (!type) return res.status(404).json({ success: false, message: 'Switch type not found or deleted' });
        res.json({ success: true, data: type });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createSwitchType = async (req, res) => {
    try {
        const { type_name } = req.body;
        if (!type_name) return res.status(400).json({ success: false, message: 'type_name is required' });
        const newType = await prisma.switch_types.create({
            data: { type_name, active: true }
        });
        res.status(201).json({ success: true, message: 'Switch type created successfully', data: newType });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSwitchType = async (req, res) => {
    try {
        const { type_name } = req.body;
        const type_id = parseInt(req.params.id);
        const existing = await prisma.switch_types.findFirst({ where: { type_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Switch type not found or deleted' });
        const updated = await prisma.switch_types.update({ where: { type_id }, data: { type_name } });
        res.json({ success: true, message: 'Switch type updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSwitchType = async (req, res) => {
    try {
        const type_id = parseInt(req.params.id);
        const existing = await prisma.switch_types.findFirst({ where: { type_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Switch type not found or already deleted' });
        await prisma.switch_types.update({ where: { type_id }, data: { active: false } });
        res.json({ success: true, message: 'Switch type has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSwitchTypes, getSwitchTypeById, createSwitchType, updateSwitchType, deleteSwitchType };
