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

// GET - Puri space ka complete data
const getSpaceFullData = async (req, res) => {
    try {
        const space_id = parseInt(req.params.id);

        // ── Step 1: Space check karo ─────────────────────────────
        const space = await prisma.spaces.findFirst({
            where: { space_id, active: true }
        });

        if (!space) {
            return res.status(404).json({
                success: false,
                message: 'Space not found or deleted'
            });
        }

        // ── Step 2: Rooms + Boards + Switches ────────────────────
        const rooms = await prisma.rooms.findMany({
            where: { space_id, active: true },
            include: {
                switch_boards: {
                    where: { active: true },
                    include: {
                        switches: {
                            where: { active: true },
                            include: {
                                switch_types: true,
                                switch_functions: {
                                    where: { active: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        // ── Step 3: Users (space access wale) ────────────────────
        const userAccess = await prisma.user_space_access.findMany({
            where: { space_id, active: true },
            include: {
                users: {
                    select: {
                        user_id: true,
                        user_name: true,
                        email: true,
                        role: true,
                        created_at: true
                        // password nahi lena
                    }
                }
            }
        });
        const users = userAccess
            .map(a => a.users)
            .filter(Boolean);

        // ── Step 4: All switch IDs is space ke ───────────────────
        const allSwitchIds = [];
        rooms.forEach(room => {
            room.switch_boards.forEach(board => {
                board.switches.forEach(sw => {
                    allSwitchIds.push(sw.switch_id);
                });
            });
        });

        // ── Step 5: Scenes (in switch IDs se trigger hone wale) ──
        const scenes = await prisma.scenes.findMany({
            where: {
                active: true,
                trigger_switch_id: { in: allSwitchIds }
            },
            include: {
                scene_actions: {
                    where: { active: true },
                    include: {
                        switches: {
                            include: { switch_types: true }
                        }
                    }
                }
            }
        });

        // ── Step 6: Beacon Scenes ─────────────────────────────────
        const beacon_scenes = await prisma.beacon_scenes.findMany({
            where: {
                active: true,
                trigger_switch_id: { in: allSwitchIds }
            },
            include: {
                beacon_scene_actions: {
                    where: { active: true },
                    include: {
                        switches: {
                            include: { switch_types: true }
                        }
                    }
                }
            }
        });

        // ── Step 7: Devices (is space ke rooms ke MACs) ───────────
        const roomMacs = rooms
            .map(r => r.metadata ? JSON.parse(r.metadata)?.mac : null)
            .filter(Boolean);

        const devices = await prisma.device_list.findMany({
            where: {
                active: true,
                ...(roomMacs.length > 0 && { mac_id: { in: roomMacs } })
            }
        });

        // ── Step 8: Clean response banao ──────────────────────────
        const response = {
            space_id: space.space_id,
            space_name: space.space_name,
            active: space.active,
            created_at: space.created_at,
            updated_at: space.updated_at,

            users,

            rooms: rooms.map(room => ({
                room_id: room.room_id,
                room_name: room.room_name,
                metadata: room.metadata,
                created_at: room.created_at,

                switch_boards: room.switch_boards.map(board => ({
                    board_id: board.board_id,
                    board_name: board.board_name,
                    metadata: board.metadata,

                    switches: board.switches.map(sw => ({
                        switch_id: sw.switch_id,
                        switch_name: sw.switch_name,
                        current_status: sw.current_status,
                        metadata: sw.metadata,
                        type: sw.switch_types?.type_name || null,
                        switch_function: sw.switch_functions?.[0] || null
                    }))
                }))
            })),

            scenes,
            beacon_scenes,
            devices
        };

        res.json({ success: true, data: response });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const createSpaceWithAccess = async (req, res) => {
    try {
        const { space_name } = req.body;
        const user_id = req.user.user_id; // JWT se aaya

        if (!space_name) {
            return res.status(400).json({
                success: false,
                message: 'space_name is required'
            });
        }

        // Step 1: Space banao
        const newSpace = await prisma.spaces.create({
            data: { space_name, active: true }
        });

        // Step 2: User ko space assign karo (automatically)
        await prisma.user_space_access.create({
            data: {
                user_id,
                space_id: newSpace.space_id,
                active: true
            }
        });

        // Step 3: User ke saare spaces fetch karo
        const allUserSpaces = await prisma.user_space_access.findMany({
            where: { user_id, active: true }
        });

        const space_ids = allUserSpaces.map(a => a.space_id);

        // Step 4: Naya token generate karo space_ids ke sath
        const jwt = require('jsonwebtoken');
        const payload = { user_id };

        if (space_ids.length === 1) {
            payload.space_id = space_ids[0];
        } else {
            payload.space_ids = space_ids;
        }

        const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });

        res.status(201).json({
            success: true,
            message: 'Space created and assigned successfully',
            token: newToken, // Updated token
            data: {
                space_id: newSpace.space_id,
                space_name: newSpace.space_name,
                all_space_ids: space_ids
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSpaces, getSpaceById, createSpace,  updateSpace, deleteSpace ,  getSpaceFullData , createSpaceWithAccess, };