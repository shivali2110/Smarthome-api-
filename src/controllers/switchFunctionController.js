const prisma = require('../db');

const getAllSwitchFunctions = async (req, res) => {
    try {
        const functions = await prisma.switch_functions.findMany({
            where: { active: true },
            include: { switches: true }
        });
        res.json({ success: true, data: functions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSwitchFunctionById = async (req, res) => {
    try {
        const fn = await prisma.switch_functions.findFirst({
            where: { function_id: parseInt(req.params.id), active: true },
            include: { switches: true }
        });
        if (!fn) return res.status(404).json({ success: false, message: 'Switch function not found' });
        res.json({ success: true, data: fn });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createSwitchFunction = async (req, res) => {
    try {
        const { switch_id, action_on, action_off } = req.body;
        if (!switch_id) return res.status(400).json({ success: false, message: 'switch_id is required' });
        const newFn = await prisma.switch_functions.create({
            data: {
                switch_id: parseInt(switch_id),
                action_on,
                action_off,
                active: true
            }
        });
        res.status(201).json({ success: true, message: 'Switch function created successfully', data: newFn });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSwitchFunction = async (req, res) => {
    try {
        const { action_on, action_off } = req.body;
        const function_id = parseInt(req.params.id);
        const existing = await prisma.switch_functions.findFirst({ where: { function_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Switch function not found' });
        const updated = await prisma.switch_functions.update({
            where: { function_id },
            data: { action_on, action_off }
        });
        res.json({ success: true, message: 'Switch function updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSwitchFunction = async (req, res) => {
    try {
        const function_id = parseInt(req.params.id);
        const existing = await prisma.switch_functions.findFirst({ where: { function_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Switch function not found' });
        await prisma.switch_functions.update({ where: { function_id }, data: { active: false } });
        res.json({ success: true, message: 'Switch function deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSwitchFunctions, getSwitchFunctionById, createSwitchFunction, updateSwitchFunction, deleteSwitchFunction };
