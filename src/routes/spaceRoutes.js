const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllSpaces,
    getSpaceById,
    getSpaceFullData,
    createSpace,
    createSpaceWithAccess,
    updateSpace,
    deleteSpace
} = require('../controllers/spaceController');

router.get('/all', getAllSpaces);
router.get('/:id/full', getSpaceFullData);
router.get('/:id', getSpaceById);
router.post('/', createSpace);
router.post('/create', authMiddleware, createSpaceWithAccess); // ← Merged API
router.put('/update/:id', updateSpace);
router.delete('/delete/:id', deleteSpace);

module.exports = router;