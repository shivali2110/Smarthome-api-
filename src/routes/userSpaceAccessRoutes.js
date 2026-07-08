const express = require('express');
const router = express.Router();
const { getAllUserSpaceAccess, getUserSpaceAccessById, createUserSpaceAccess, deleteUserSpaceAccess } = require('../controllers/userSpaceAccessController');

router.get('/all', getAllUserSpaceAccess);
router.get('/:id', getUserSpaceAccessById);
router.post('/', createUserSpaceAccess);
router.delete('/delete/:id', deleteUserSpaceAccess);

module.exports = router;
