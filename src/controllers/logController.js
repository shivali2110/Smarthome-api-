const prisma = require('../db');

// ── SCENE LOGS ────────────────────────────────────────────────────
const getAllSceneLogs = async (req, res) => {
    try {
        const logs = await prisma.scene_logs.findMany({
            include: { scenes: true, users: true },
            orderBy: { trigger_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSceneLogsBySceneId = async (req, res) => {
    try {
        const logs = await prisma.scene_logs.findMany({
            where: { scene_id: parseInt(req.params.sceneId) },
            include: { scenes: true, users: true },
            orderBy: { trigger_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSceneLogsByUserId = async (req, res) => {
    try {
        const logs = await prisma.scene_logs.findMany({
            where: { triggered_by_user_id: parseInt(req.params.userId) },
            include: { scenes: true },
            orderBy: { trigger_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── BEACON SCENE LOGS ─────────────────────────────────────────────
const getAllBeaconSceneLogs = async (req, res) => {
    try {
        const logs = await prisma.beacon_scene_logs.findMany({
            include: { beacon_scenes: true, users: true },
            orderBy: { trigger_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBeaconSceneLogsByBeaconSceneId = async (req, res) => {
    try {
        const logs = await prisma.beacon_scene_logs.findMany({
            where: { beacon_scene_id: parseInt(req.params.beaconSceneId) },
            include: { beacon_scenes: true, users: true },
            orderBy: { trigger_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBeaconSceneLogsByUserId = async (req, res) => {
    try {
        const logs = await prisma.beacon_scene_logs.findMany({
            where: { triggered_by_user_id: parseInt(req.params.userId) },
            include: { beacon_scenes: true },
            orderBy: { trigger_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── ACTIVITY LOGS ─────────────────────────────────────────────────
const getAllActivityLogs = async (req, res) => {
    try {
        const logs = await prisma.activity_logs.findMany({
            include: { users: true, switches: true },
            orderBy: { action_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getActivityLogsByUserId = async (req, res) => {
    try {
        const logs = await prisma.activity_logs.findMany({
            where: { user_id: parseInt(req.params.userId) },
            include: { switches: true },
            orderBy: { action_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getActivityLogsBySwitchId = async (req, res) => {
    try {
        const logs = await prisma.activity_logs.findMany({
            where: { switch_id: parseInt(req.params.switchId) },
            include: { users: true },
            orderBy: { action_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── LOGIN LOGS ────────────────────────────────────────────────────
const getAllLoginLogs = async (req, res) => {
    try {
        const logs = await prisma.login_logs.findMany({
            include: { users: true },
            orderBy: { login_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLoginLogsByUserId = async (req, res) => {
    try {
        const logs = await prisma.login_logs.findMany({
            where: { user_id: parseInt(req.params.userId) },
            include: { users: true },
            orderBy: { login_time: 'desc' }
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllSceneLogs, getSceneLogsBySceneId, getSceneLogsByUserId,
    getAllBeaconSceneLogs, getBeaconSceneLogsByBeaconSceneId, getBeaconSceneLogsByUserId,
    getAllActivityLogs, getActivityLogsByUserId, getActivityLogsBySwitchId,
    getAllLoginLogs, getLoginLogsByUserId
};
