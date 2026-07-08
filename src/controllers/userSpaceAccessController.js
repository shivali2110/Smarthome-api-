const prisma = require('../db');

const getAllUserSpaceAccess = async (req, res) => {
    try {
        const access = await prisma.user_space_access.findMany({
            where: { active: true },
            include: { users: true, spaces: true }
        });
        res.json({ success: true, data: access });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserSpaceAccessById = async (req, res) => {
    try {
        const access = await prisma.user_space_access.findFirst({
            where: { access_id: parseInt(req.params.id), active: true },
            include: { users: true, spaces: true }
        });
        if (!access) return res.status(404).json({ success: false, message: 'Access not found' });
        res.json({ success: true, data: access });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createUserSpaceAccess = async (req, res) => {
    try {
        const { user_id, space_id } = req.body;
        if (!user_id || !space_id) return res.status(400).json({ success: false, message: 'user_id and space_id are required' });
        const existing = await prisma.user_space_access.findFirst({
            where: { user_id: parseInt(user_id), space_id: parseInt(space_id), active: true }
        });
        if (existing) return res.status(400).json({ success: false, message: 'User already has access to this space' });
        const newAccess = await prisma.user_space_access.create({
            data: { user_id: parseInt(user_id), space_id: parseInt(space_id), active: true }
        });
        res.status(201).json({ success: true, message: 'User space access created successfully', data: newAccess });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUserSpaceAccess = async (req, res) => {
    try {
        const access_id = parseInt(req.params.id);
        const existing = await prisma.user_space_access.findFirst({ where: { access_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Access not found' });
        await prisma.user_space_access.update({ where: { access_id }, data: { active: false } });
        res.json({ success: true, message: 'User space access removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllUserSpaceAccess, getUserSpaceAccessById, createUserSpaceAccess, deleteUserSpaceAccess };
