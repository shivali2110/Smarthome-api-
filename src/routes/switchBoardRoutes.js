const express = require('express');
const router = express.Router();
const { getAllSwitchBoards, getSwitchBoardById, createSwitchBoard, updateSwitchBoard, deleteSwitchBoard } = require('../controllers/switchBoardController');

router.get('/all', getAllSwitchBoards);
router.get('/:id', getSwitchBoardById);
router.post('/', createSwitchBoard);
router.put('/update/:id', updateSwitchBoard);
router.delete('/delete/:id', deleteSwitchBoard);

module.exports = router;
