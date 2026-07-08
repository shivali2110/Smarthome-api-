const express = require('express');
const router = express.Router();
const { getAllSwitchFunctions, getSwitchFunctionById, createSwitchFunction, updateSwitchFunction, deleteSwitchFunction } = require('../controllers/switchFunctionController');

router.get('/all', getAllSwitchFunctions);
router.get('/:id', getSwitchFunctionById);
router.post('/', createSwitchFunction);
router.put('/update/:id', updateSwitchFunction);
router.delete('/delete/:id', deleteSwitchFunction);

module.exports = router;
