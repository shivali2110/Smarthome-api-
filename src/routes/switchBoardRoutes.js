const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllSwitchBoards,
    getSwitchBoardById,
    createSwitchBoard,
    createBoard,
    assignBoardToRoom,
    getRoomWithBoards,
    updateSwitchBoard,
    deleteSwitchBoard
} = require('../controllers/switchBoardController');

router.get('/all', getAllSwitchBoards);
router.get('/:id', getSwitchBoardById);
router.post('/', authMiddleware, createSwitchBoard); 
router.post('/', createSwitchBoard);
router.post('/create', authMiddleware, createBoard);           // ← Naya
router.post('/assign-room', authMiddleware, assignBoardToRoom); // ← Naya
router.put('/update/:id', updateSwitchBoard);
router.delete('/delete/:id', deleteSwitchBoard);

module.exports = router;