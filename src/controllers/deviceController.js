const prisma = require('../db');

const getAllDevices = async (req, res) => {
    try {
        const devices = await prisma.device_list.findMany({ where: { active: true } });
        res.json({ success: true, data: devices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDeviceById = async (req, res) => {
    try {
        const device = await prisma.device_list.findFirst({
            where: { device_id: parseInt(req.params.id), active: true }
        });
        if (!device) return res.status(404).json({ success: false, message: 'Device not found or deleted' });
        res.json({ success: true, data: device });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createDevice = async (req, res) => {
    try {
        const { mac_id, node_id } = req.body;
        if (!mac_id || !node_id) {
            return res.status(400).json({ success: false, message: 'mac_id and node_id are required' });
        }
        const existing = await prisma.device_list.findFirst({ where: { mac_id } });
        if (existing) return res.status(400).json({ success: false, message: 'Device with this MAC ID already exists' });
        const newDevice = await prisma.device_list.create({
            data: { mac_id, node_id, active: true }
        });
        res.status(201).json({ success: true, message: 'Device created successfully', data: newDevice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateDevice = async (req, res) => {
    try {
        const { mac_id, node_id } = req.body;
        const device_id = parseInt(req.params.id);
        const existing = await prisma.device_list.findFirst({ where: { device_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Device not found or deleted' });
        const updated = await prisma.device_list.update({
            where: { device_id },
            data: { mac_id, node_id }
        });
        res.json({ success: true, message: 'Device updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteDevice = async (req, res) => {
    try {
        const device_id = parseInt(req.params.id);
        const existing = await prisma.device_list.findFirst({ where: { device_id, active: true } });
        if (!existing) return res.status(404).json({ success: false, message: 'Device not found or already deleted' });
        await prisma.device_list.update({ where: { device_id }, data: { active: false } });
        res.json({ success: true, message: 'Device has been deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllDevices, getDeviceById, createDevice, updateDevice, deleteDevice };
