const prisma = require('../db');

const getAllInvites = async (req, res) => {
    try {
        const invites = await prisma.invites.findMany({
            include: { users_invites_invited_by_user_idTousers: true }
        });
        res.json({ success: true, data: invites });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getInviteById = async (req, res) => {
    try {
        const invite = await prisma.invites.findFirst({
            where: { invite_id: parseInt(req.params.id) }
        });
        if (!invite) return res.status(404).json({ success: false, message: 'Invite not found' });
        res.json({ success: true, data: invite });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const sendInvite = async (req, res) => {
    try {
        const { invited_by_user_id, invited_email } = req.body;
        if (!invited_by_user_id || !invited_email) {
            return res.status(400).json({ success: false, message: 'invited_by_user_id and invited_email are required' });
        }
        const existing = await prisma.invites.findFirst({ where: { invited_email, invite_status: 'Pending' } });
        if (existing) return res.status(400).json({ success: false, message: 'Invite already sent to this email' });
        const newInvite = await prisma.invites.create({
            data: { invited_by_user_id: parseInt(invited_by_user_id), invited_email, invite_status: 'Pending' }
        });
        res.status(201).json({ success: true, message: 'Invite sent successfully', data: newInvite });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateInvite = async (req, res) => {
    try {
        const { invite_status, accepted_user_id } = req.body;
        const invite_id = parseInt(req.params.id);
        const existing = await prisma.invites.findFirst({ where: { invite_id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Invite not found' });
        const updated = await prisma.invites.update({
            where: { invite_id },
            data: { invite_status, accepted_user_id: accepted_user_id ? parseInt(accepted_user_id) : null }
        });
        res.json({ success: true, message: `Invite ${invite_status} successfully`, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteInvite = async (req, res) => {
    try {
        const invite_id = parseInt(req.params.id);
        const existing = await prisma.invites.findFirst({ where: { invite_id } });
        if (!existing) return res.status(404).json({ success: false, message: 'Invite not found' });
        await prisma.invites.delete({ where: { invite_id } });
        res.json({ success: true, message: 'Invite deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllInvites, getInviteById, sendInvite, updateInvite, deleteInvite };
