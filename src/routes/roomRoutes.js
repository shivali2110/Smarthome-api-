const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');
const { getRoomWithBoards } = require('../controllers/switchBoardController');

router.get('/all', getAllRooms);
router.get('/:id/details', getRoomWithBoards); // ← New (placed before /:id!)
router.get('/:id', getRoomById);
router.post('/', authMiddleware, createRoom);
router.put('/update/:id', updateRoom);
router.delete('/delete/:id', deleteRoom);

module.exports = router;