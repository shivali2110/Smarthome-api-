const express = require('express');
const router = express.Router();
const { getAllDevices, getDeviceById, createDevice, updateDevice, deleteDevice } = require('../controllers/deviceController');

router.get('/all', getAllDevices);
router.get('/:id', getDeviceById);
router.post('/', createDevice);
router.put('/update/:id', updateDevice);
router.delete('/delete/:id', deleteDevice);

module.exports = router;
