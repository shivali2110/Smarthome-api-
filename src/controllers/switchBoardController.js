const prisma = require('../db');

const getAllSwitchBoards = async (req, res) => {
    try {
        const boards = await prisma.switch_boards.findMany({
            where: {
                active: true,
                rooms: {
                    active: true,           
                    spaces: { active: true } 
                }
            },
            include: { rooms: true }
        });
        res.json({ success: true, data: boards });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSwitchBoardById = async (req, res) => {
    try {
        const board = await prisma.switch_boards.findFirst({
            where: { board_id: parseInt(req.params.id), active: true },
            include: { rooms: true }
        });
        if (!board) return res.status(404).json({ success: false, message: 'Switch board not found or deleted' });
        res.json({ success: true, data: board });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createSwitchBoard = async (req, res) => {
    try {
        const { board_name, room_id } = req.body;
        if (!board_name || !room_id) {
            return res.status(400).json({ success: false, message: 'board_name and room_id are required' });
        }
        const newBoard = await prisma.switch_boards.create({
            data: { board_name, room_id: parseInt(room_id), active: true }
        });
        res.status(201).json({ success: true, message: 'Switch board created successfully', data: newBoard });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSwitchBoard = async (req, res) => {
    try {
        const { board_name, room_id } = req.body;
        const board_id = parseInt(req.params.id);
        const existing = await prisma.switch_boards.findFirst({ where: { board_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Switch board not found or deleted' });
        const updated = await prisma.switch_boards.update({
            where: { board_id },
            data: { board_name, room_id: room_id ? parseInt(room_id) : existing.room_id }
        });
        res.json({ success: true, message: 'Switch board updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSwitchBoard = async (req, res) => {
    try {
        const board_id = parseInt(req.params.id);
        const existing = await prisma.switch_boards.findFirst({ where: { board_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Switch board not found or already deleted' });
        await prisma.switch_boards.update({ where: { board_id }, data: { active: false } });
        res.json({ success: true, message: 'Switch board has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSwitchBoards, getSwitchBoardById, createSwitchBoard, updateSwitchBoard, deleteSwitchBoard };
