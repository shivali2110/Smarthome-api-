const prisma = require('../db');

const getAllRooms = async (req, res) => {
    try {
        const rooms = await prisma.rooms.findMany({
            where: {
                active: true,
                spaces: {
                    active: true    
                }
            },
            include: {
                spaces: true
            }
        });
        res.json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getRoomById = async (req, res) => {
    try {
        const room = await prisma.rooms.findFirst({
            where: {
                room_id: parseInt(req.params.id),
                active: true,
                spaces: {
                    active: true  
                }
            },
            include: {
                spaces: true
            }
        });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found or its space has been deleted'
            });
        }
        res.json({ success: true, data: room });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const createRoom = async (req, res) => {
    try {
        const { room_name, space_id } = req.body;
        if (!room_name || !space_id) {
            return res.status(400).json({ success: false, message: 'room_name and space_id are required' });
        }
        const newRoom = await prisma.rooms.create({
            data: { room_name, space_id: parseInt(space_id), active: true }
        });
        res.status(201).json({ success: true, message: 'Room created successfully', data: newRoom });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateRoom = async (req, res) => {
    try {
        const { room_name, space_id } = req.body;
        const room_id = parseInt(req.params.id);
        const existing = await prisma.rooms.findFirst({ where: { room_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Room not found or deleted' });
        const updated = await prisma.rooms.update({
            where: { room_id },
            data: { room_name, space_id: space_id ? parseInt(space_id) : existing.space_id }
        });
        res.json({ success: true, message: 'Room updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const room_id = parseInt(req.params.id);
        const existing = await prisma.rooms.findFirst({ where: { room_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Room not found or already deleted' });
        await prisma.rooms.update({ where: { room_id }, data: { active: false } });
        res.json({ success: true, message: 'Room has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom };
