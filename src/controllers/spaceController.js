const prisma = require('../db');

// GET - Saare active spaces lao
// GET /api/spaces/all
const getAllSpaces = async (req, res) => {
    try {
        const spaces = await prisma.spaces.findMany({
            where: { active: true }  // 1 → true
        });
        res.json({ success: true, data: spaces });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET - Ek space lao by ID
// GET /api/spaces/:id
const getSpaceById = async (req, res) => {
    try {
        const space = await prisma.spaces.findFirst({
            where: {
                space_id: parseInt(req.params.id),
                active: true  // 1 → true
            }
        });
        if (!space) {
            return res.status(404).json({ success: false, message: 'Space not found or deleted' });
        }
        res.json({ success: true, data: space });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST - Naya space banao
// POST /api/spaces
const createSpace = async (req, res) => {
    try {
        const { space_name } = req.body;
        if (!space_name) {
            return res.status(400).json({ success: false, message: 'space_name is required' });
        }
        const newSpace = await prisma.spaces.create({
            data: {
                space_name,
                active: true  // 1 → true
            }
        });
        res.status(201).json({ success: true, message: 'Space created successfully', data: newSpace });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// PUT - Space update karo
// PUT /api/spaces/update/:id
const updateSpace = async (req, res) => {
    try {
        const { space_name } = req.body;
        const space_id = parseInt(req.params.id);
        const existing = await prisma.spaces.findFirst({
            where: { space_id, active: true }  // 1 → true
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Space not found or deleted' });
        }
        const updated = await prisma.spaces.update({
            where: { space_id },
            data: { space_name }
        });
        res.json({ success: true, message: 'Space updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// DELETE - Soft delete (active = 0)
// DELETE /api/spaces/delete/:id
const deleteSpace = async (req, res) => {
    try {
        const space_id = parseInt(req.params.id);
        const existing = await prisma.spaces.findFirst({
            where: { space_id, active: true }  // 1 → true
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Space not found or already deleted' });
        }
        await prisma.spaces.update({
            where: { space_id },
            data: { active: false }  // 0 → false
        });
        res.json({ success: true, message: 'Space has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSpaces, getSpaceById, createSpace, updateSpace, deleteSpace };