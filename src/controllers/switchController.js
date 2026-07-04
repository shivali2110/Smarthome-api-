const prisma = require('../db');

const getAllSwitches = async (req, res) => {
    try {
        const switches = await prisma.switches.findMany({
            where: {
                active: true,
                switch_boards: {
                    active: true,
                    rooms: {
                        active: true,
                        spaces: { active: true }
                    }
                }
            },
            include: { switch_boards: true, switch_types: true }
        });
        res.json({ success: true, data: switches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSwitchById = async (req, res) => {
    try {
        const sw = await prisma.switches.findFirst({
            where: { switch_id: parseInt(req.params.id), active: true },
            include: { switch_boards: true, switch_types: true }
        });
        if (!sw) return res.status(404).json({ success: false, message: 'Switch not found or deleted' });
        res.json({ success: true, data: sw });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createSwitch = async (req, res) => {
    try {
        const { switch_name, board_id, type_id, current_status, metadata } = req.body;
        if (!switch_name || !board_id || !type_id) {
            return res.status(400).json({ success: false, message: 'switch_name, board_id and type_id are required' });
        }
        const newSwitch = await prisma.switches.create({
            data: {
                switch_name,
                board_id: parseInt(board_id),
                type_id: parseInt(type_id),
                current_status: current_status ?? false,
                metadata: metadata ? JSON.stringify(metadata) : null,
                active: true
            }
        });
        res.status(201).json({ success: true, message: 'Switch created successfully', data: newSwitch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSwitch = async (req, res) => {
    try {
        const { switch_name, board_id, type_id, current_status, metadata } = req.body;
        const switch_id = parseInt(req.params.id);
        const existing = await prisma.switches.findFirst({ where: { switch_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Switch not found or deleted' });
        const updated = await prisma.switches.update({
            where: { switch_id },
            data: {
                switch_name,
                board_id: board_id ? parseInt(board_id) : existing.board_id,
                type_id: type_id ? parseInt(type_id) : existing.type_id,
                current_status: current_status ?? existing.current_status,
                metadata: metadata ? JSON.stringify(metadata) : existing.metadata
            }
        });
        res.json({ success: true, message: 'Switch updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSwitch = async (req, res) => {
    try {
        const switch_id = parseInt(req.params.id);
        const existing = await prisma.switches.findFirst({ where: { switch_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Switch not found or already deleted' });
        await prisma.switches.update({ where: { switch_id }, data: { active: false } });
        res.json({ success: true, message: 'Switch has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSwitches, getSwitchById, createSwitch, updateSwitch, deleteSwitch };
