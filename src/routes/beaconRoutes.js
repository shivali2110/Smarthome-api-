const express = require('express');
const router = express.Router();
const { getAllBeacons, getBeaconById, createBeacon, updateBeacon, deleteBeacon } = require('../controllers/beaconController');

router.get('/all', getAllBeacons);
router.get('/:id', getBeaconById);
router.post('/', createBeacon);
router.put('/update/:id', updateBeacon);
router.delete('/delete/:id', deleteBeacon);

module.exports = router;
