const express = require('express');
const router = express.Router();
const { getAllInvites, getInviteById, sendInvite, updateInvite, deleteInvite } = require('../controllers/inviteController');

router.get('/all', getAllInvites);
router.get('/:id', getInviteById);
router.post('/', sendInvite);
router.put('/update/:id', updateInvite);
router.delete('/delete/:id', deleteInvite);

module.exports = router;
