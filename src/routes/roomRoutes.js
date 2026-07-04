const express = require('express');
const router = express.Router();
const { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');

router.get('/all', getAllRooms);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/update/:id', updateRoom);
router.delete('/delete/:id', deleteRoom);

module.exports = router;
