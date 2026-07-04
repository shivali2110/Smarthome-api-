const express = require('express');
const router = express.Router();
const { getAllSwitches, getSwitchById, createSwitch, updateSwitch, deleteSwitch } = require('../controllers/switchController');

router.get('/all', getAllSwitches);
router.get('/:id', getSwitchById);
router.post('/', createSwitch);
router.put('/update/:id', updateSwitch);
router.delete('/delete/:id', deleteSwitch);

module.exports = router;
