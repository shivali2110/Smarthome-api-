const prisma = require('../db');

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany({
            where: { active: true },
            select: {
                user_id: true, user_name: true, email: true,
                role: true, created_at: true
                // password select nahi kiya security ke liye
            }
        });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await prisma.users.findFirst({
            where: { user_id: parseInt(req.params.id), active: true },
            select: {
                user_id: true, user_name: true, email: true,
                role: true, created_at: true
            }
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found or deleted' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { user_name, email, password, role } = req.body;
        if (!user_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'user_name, email and password are required' });
        }
        // Check email already exist karta hai ya nahi
        const existingUser = await prisma.users.findFirst({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        const newUser = await prisma.users.create({
            data: { user_name, email, password, role: role || 'Member', active: true }
        });
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ success: true, message: 'User created successfully', data: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { user_name, email, role } = req.body;
        const user_id = parseInt(req.params.id);
        const existing = await prisma.users.findFirst({ where: { user_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'User not found or deleted' });
        const updated = await prisma.users.update({
            where: { user_id },
            data: { user_name, email, role }
        });
        const { password: _, ...userWithoutPassword } = updated;
        res.json({ success: true, message: 'User updated successfully', data: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user_id = parseInt(req.params.id);
        const existing = await prisma.users.findFirst({ where: { user_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'User not found or already deleted' });
        await prisma.users.update({ where: { user_id }, data: { active: false } });
        res.json({ success: true, message: 'User has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
