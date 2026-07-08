const express = require('express');
const router = express.Router();
const { getAllBeaconSceneActions, getBeaconSceneActionsByBeaconSceneId, createBeaconSceneAction, updateBeaconSceneAction, deleteBeaconSceneAction } = require('../controllers/beaconSceneActionController');

router.get('/all', getAllBeaconSceneActions);
router.get('/beacon-scene/:beaconSceneId', getBeaconSceneActionsByBeaconSceneId);
router.post('/', createBeaconSceneAction);
router.put('/update/:id', updateBeaconSceneAction);
router.delete('/delete/:id', deleteBeaconSceneAction);

module.exports = router;
