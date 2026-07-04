const express = require('express');
const router = express.Router();
const { getAllSwitchTypes, getSwitchTypeById, createSwitchType, updateSwitchType, deleteSwitchType } = require('../controllers/switchTypeController');

router.get('/all', getAllSwitchTypes);
router.get('/:id', getSwitchTypeById);
router.post('/', createSwitchType);
router.put('/update/:id', updateSwitchType);
router.delete('/delete/:id', deleteSwitchType);

module.exports = router;
