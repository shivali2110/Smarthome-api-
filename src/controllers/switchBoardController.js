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
        const { board_name, room_id, board_type, space_id } = req.body;
        const user_id = req.user?.user_id || null; // JWT se aaya

        if (!board_name) {
            return res.status(400).json({
                success: false,
                message: 'board_name is required'
            });
        }

        const newBoard = await prisma.switch_boards.create({
            data: {
                board_name,
                room_id: room_id ? parseInt(room_id) : null,
                board_type: board_type || null,
                user_id,
                space_id: space_id ? parseInt(space_id) : null,
                active: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Switch board created successfully',
            data: newBoard
        });
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

// POST /api/boards/create — Naya board banao (user + space linked)
const createBoard = async (req, res) => {
    try {
        const { space_id, board_name, board_type } = req.body;
        const user_id = req.user.user_id; // JWT se aaya

        if (!space_id || !board_name) {
            return res.status(400).json({
                success: false,
                message: 'space_id and board_name are required'
            });
        }

        // Check karo user ko is space ka access hai ya nahi
        const hasAccess = await prisma.user_space_access.findFirst({
            where: {
                user_id,
                space_id: parseInt(space_id),
                active: true
            }
        });

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this space'
            });
        }

        // Board banao
        const newBoard = await prisma.switch_boards.create({
            data: {
                board_name,
                board_type: board_type || null,
                user_id,
                space_id: parseInt(space_id),
                active: true
            }
        });

        res.status(201).json({
            success: true,
            board_id: newBoard.board_id,
            data: newBoard
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/rooms/assign-board — Board ko room se assign karo
const assignBoardToRoom = async (req, res) => {
    try {
        const { room_id, board_id } = req.body;
        const user_id = req.user.user_id;

        if (!room_id || !board_id) {
            return res.status(400).json({
                success: false,
                message: 'room_id and board_id are required'
            });
        }

        // Room exist karta hai check karo
        const room = await prisma.rooms.findFirst({
            where: { room_id: parseInt(room_id), active: true }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Board exist karta hai check karo
        const board = await prisma.switch_boards.findFirst({
            where: { board_id: parseInt(board_id), active: true }
        });

        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Switch board not found'
            });
        }

        // Already assigned hai check karo
        const alreadyAssigned = await prisma.room_boards.findFirst({
            where: {
                room_id: parseInt(room_id),
                board_id: parseInt(board_id),
                active: true
            }
        });

        if (alreadyAssigned) {
            return res.status(400).json({
                success: false,
                message: 'Board already assigned to this room'
            });
        }

        // Assign karo
        const assignment = await prisma.room_boards.create({
            data: {
                room_id: parseInt(room_id),
                board_id: parseInt(board_id),
                active: true
            }
        });

        res.json({
            success: true,
            message: 'Board assigned to room successfully',
            data: assignment
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/rooms/:id/details — Room + assigned boards ka pura data
const getRoomWithBoards = async (req, res) => {
    try {
        const room_id = parseInt(req.params.id);

        const room = await prisma.rooms.findFirst({
            where: { room_id, active: true },
            include: { spaces: true }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Room ke assigned boards fetch karo
        const roomBoards = await prisma.room_boards.findMany({
            where: { room_id, active: true },
            include: {
                switch_boards: {
                    include: {
                        switches: {
                            where: { active: true },
                            include: {
                                switch_types: true,
                                switch_functions: { where: { active: true } }
                            }
                        }
                    }
                }
            }
        });

        res.json({
            success: true,
            data: {
                room_id: room.room_id,
                room_name: room.room_name,
                space: room.spaces,
                assigned_boards: roomBoards.map(rb => ({
                    assignment_id: rb.id,
                    assigned_at: rb.assigned_at,
                    board_id: rb.switch_boards.board_id,
                    board_name: rb.switch_boards.board_name,
                    board_type: rb.switch_boards.board_type,
                    switches: rb.switch_boards.switches
                }))
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSwitchBoards, getSwitchBoardById, createSwitchBoard, updateSwitchBoard, deleteSwitchBoard , getRoomWithBoards , createBoard, assignBoardToRoom };
