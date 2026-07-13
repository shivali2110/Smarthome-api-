const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── Token generate karne ka helper ───────────────────────────────
const generateToken = (user_id, space_ids = []) => {
    const payload = { user_id };

    if (space_ids.length === 1) {
        payload.space_id = space_ids[0];
    } else if (space_ids.length > 1) {
        payload.space_ids = space_ids;
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// ── REGISTER ─────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { user_name, email, password, role } = req.body;

        if (!user_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'user_name, email and password are required'
            });
        }

        // Check email already exist karta hai ya nahi
        const existingUser = await prisma.users.findFirst({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please login.'
            });
        }

        // Password hash karo
        const hashedPassword = await bcrypt.hash(password, 10);

        // User banao
        const newUser = await prisma.users.create({
            data: {
                user_name,
                email,
                password: hashedPassword,
                role: role || 'Member',
                active: true
            }
        });

        // Login log banao
        await prisma.login_logs.create({
            data: { user_id: newUser.user_id }
        });

        // Token generate karo (abhi koi space nahi)
        const token = generateToken(newUser.user_id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                user_id: newUser.user_id,
                user_name: newUser.user_name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── LOGIN ─────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // User dhundo
        const user = await prisma.users.findFirst({
            where: { email, active: true }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please register first.'
            });
        }

        // Password check karo
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password.'
            });
        }

        // User ke existing spaces fetch karo
        const userSpaces = await prisma.user_space_access.findMany({
            where: { user_id: user.user_id, active: true },
            include: { spaces: true }
        });

        const space_ids = userSpaces
            .filter(a => a.spaces?.active)
            .map(a => a.space_id);

        // Token generate karo (spaces ke sath)
        const token = generateToken(user.user_id, space_ids);

        // Login log banao
        await prisma.login_logs.create({
            data: { user_id: user.user_id }
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                email: user.email,
                role: user.role
            },
            spaces: userSpaces.map(a => ({
                space_id: a.space_id,
                space_name: a.spaces?.space_name
            }))
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── LOGOUT ────────────────────────────────────────────────────────
const logout = async (req, res) => {
    try {
        // Login log me logout_time update karo
        const lastLog = await prisma.login_logs.findFirst({
            where: {
                user_id: req.user.user_id,
                logout_time: null
            },
            orderBy: { login_time: 'desc' }
        });

        if (lastLog) {
            await prisma.login_logs.update({
                where: { login_log_id: lastLog.login_log_id },
                data: { logout_time: new Date() }
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully. Your data is preserved.'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET PROFILE ───────────────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const user = await prisma.users.findFirst({
            where: { user_id: req.user.user_id, active: true },
            select: {
                user_id: true,
                user_name: true,
                email: true,
                role: true,
                created_at: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // User ke spaces fetch karo
        const userSpaces = await prisma.user_space_access.findMany({
            where: { user_id: req.user.user_id, active: true },
            include: { spaces: true }
        });

        res.json({
            success: true,
            data: {
                ...user,
                spaces: userSpaces.map(a => ({
                    space_id: a.space_id,
                    space_name: a.spaces?.space_name
                }))
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login, logout, getProfile };
