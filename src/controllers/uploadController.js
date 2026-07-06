const prisma = require('../db');
const fs = require('fs');
const path = require('path');

// uploads folder auto-create karo agar exist na kare
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadFile = async (req, res) => {
    try {
        // Step 1: File check karo
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please upload a JSON file.'
            });
        }

        // Step 2: File read karo
        const fileContent = fs.readFileSync(req.file.path, 'utf-8');
        let data;

        try {
            data = JSON.parse(fileContent);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON file. Please check the file format.'
            });
        }

        // Step 3: Temp file delete karo
        fs.unlinkSync(req.file.path);

        // Step 4: Result tracker
        const result = {
            spaces:        { inserted: 0, skipped: 0 },
            rooms:         { inserted: 0, skipped: 0 },
            switch_boards: { inserted: 0, skipped: 0 },
            switch_types:  { inserted: 0, skipped: 0 },
            switches:      { inserted: 0, skipped: 0 },
            devices:       { inserted: 0, skipped: 0 },
            beacons:       { inserted: 0, skipped: 0 },
            users:         { inserted: 0, skipped: 0 },
            invites:       { inserted: 0, skipped: 0 },
        };

        // ── STEP 1: SPACE banao ───────────────────────────────────
        let spaceId = null;
        if (data.space_name) {
            const existingSpace = await prisma.spaces.findFirst({
                where: { space_name: data.space_name, active: true }
            });

            if (existingSpace) {
                spaceId = existingSpace.space_id;
                result.spaces.skipped++;
            } else {
                const newSpace = await prisma.spaces.create({
                    data: { space_name: data.space_name, active: true }
                });
                spaceId = newSpace.space_id;
                result.spaces.inserted++;
            }
        }

        // ── STEP 2: ROOMS + SWITCH BOARDS + SWITCHES ─────────────
        if (data.rooms && data.rooms.length > 0 && spaceId) {
            for (const room of data.rooms) {

                // ── Room banao ──
                let roomId = null;
                const existingRoom = await prisma.rooms.findFirst({
                    where: {
                        room_name: room.room_name,
                        space_id: spaceId,
                        active: true
                    }
                });

                if (existingRoom) {
                    roomId = existingRoom.room_id;
                    result.rooms.skipped++;
                } else {
                    const newRoom = await prisma.rooms.create({
                        data: {
                            room_name: room.room_name,
                            space_id: spaceId,
                            metadata: room.icon
                                ? JSON.stringify({ icon: room.icon })
                                : null,
                            active: true
                        }
                    });
                    roomId = newRoom.room_id;
                    result.rooms.inserted++;
                }

                // ── Device (node) ko device_list me save karo ──
                if (room.mac && room.node_id) {
                    const existingDevice = await prisma.device_list.findFirst({
                        where: { mac_id: room.mac, active: true }
                    });

                    if (existingDevice) {
                        result.devices.skipped++;
                    } else {
                        await prisma.device_list.create({
                            data: {
                                mac_id: room.mac,
                                node_id: room.node_id,
                                active: true
                            }
                        });
                        result.devices.inserted++;
                    }
                }

                // ── Switch Board banao (har room ka ek board) ──
                let boardId = null;
                const boardName = `${room.room_name} Board`;
                const existingBoard = await prisma.switch_boards.findFirst({
                    where: {
                        board_name: boardName,
                        room_id: roomId,
                        active: true
                    }
                });

                if (existingBoard) {
                    boardId = existingBoard.board_id;
                    result.switch_boards.skipped++;
                } else {
                    const newBoard = await prisma.switch_boards.create({
                        data: {
                            board_name: boardName,
                            room_id: roomId,
                            active: true
                        }
                    });
                    boardId = newBoard.board_id;
                    result.switch_boards.inserted++;
                }

                // ── Switches banao (room ke andar nested hai) ──
                if (room.switches && room.switches.length > 0) {
                    for (const sw of room.switches) {

                        // Switch Type check/create karo
                        let typeId = null;
                        const typeName = sw.input_type || 'bulb';
                        const existingType = await prisma.switch_types.findFirst({
                            where: { type_name: typeName, active: true }
                        });

                        if (existingType) {
                            typeId = existingType.type_id;
                            result.switch_types.skipped++;
                        } else {
                            const newType = await prisma.switch_types.create({
                                data: { type_name: typeName, active: true }
                            });
                            typeId = newType.type_id;
                            result.switch_types.inserted++;
                        }

                        // Switch banao
                        const existingSwitch = await prisma.switches.findFirst({
                            where: {
                                switch_name: sw.switch_name,
                                board_id: boardId,
                                active: true
                            }
                        });

                        if (existingSwitch) {
                            result.switches.skipped++;
                        } else {
                            await prisma.switches.create({
                                data: {
                                    switch_name: sw.switch_name,
                                    board_id: boardId,
                                    type_id: typeId,
                                    current_status: sw.device_value === '1',
                                    metadata: sw.input_icon
                                        ? JSON.stringify({ icon: sw.input_icon })
                                        : null,
                                    active: true
                                }
                            });
                            result.switches.inserted++;
                        }
                    }
                }
            }
        }

        // ── STEP 3: BEACONS ───────────────────────────────────────
        if (data.beacons && data.beacons.length > 0) {
            for (const beacon of data.beacons) {
                const existingBeacon = await prisma.beacon_list.findFirst({
                    where: { mac_id: beacon.mac_address, active: true }
                });

                if (existingBeacon) {
                    result.beacons.skipped++;
                } else {
                    await prisma.beacon_list.create({
                        data: {
                            mac_id: beacon.mac_address,
                            active: true
                        }
                    });
                    result.beacons.inserted++;
                }
            }
        }

        // ── STEP 4: USERS ─────────────────────────────────────────
        if (data.users && data.users.length > 0) {
            for (const user of data.users) {
                const existingUser = await prisma.users.findFirst({
                    where: { email: user.email, active: true }
                });

                if (existingUser) {
                    result.users.skipped++;
                } else {
                    await prisma.users.create({
                        data: {
                            user_name: user.user_name,
                            email: user.email,
                            password: user.password,
                            role: user.role || 'Member',
                            active: true
                        }
                    });
                    result.users.inserted++;
                }
            }
        }

        // ── STEP 5: INVITE EMAILS ─────────────────────────────────
        if (data.invite_email && data.invite_email.length > 0) {
            const adminUser = await prisma.users.findFirst({
                where: { role: 'Admin', active: true }
            });

            for (const email of data.invite_email) {
                const existingInvite = await prisma.invites.findFirst({
                    where: { invited_email: email }
                });

                if (existingInvite) {
                    result.invites.skipped++;
                } else {
                    await prisma.invites.create({
                        data: {
                            invited_by_user_id: adminUser ? adminUser.user_id : 1,
                            invited_email: email,
                            invite_status: 'Pending'
                        }
                    });
                    result.invites.inserted++;
                }
            }
        }

        // Step 6: Response bhejo
        res.status(200).json({
            success: true,
            message: 'File uploaded and processed successfully',
            result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { uploadFile };