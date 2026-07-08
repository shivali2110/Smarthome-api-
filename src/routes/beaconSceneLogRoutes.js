const express = require('express');
const router = express.Router();
const { getAllBeaconSceneLogs, getBeaconSceneLogsByBeaconSceneId, getBeaconSceneLogsByUserId } = require('../controllers/logController');

router.get('/all', getAllBeaconSceneLogs);
router.get('/beacon-scene/:beaconSceneId', getBeaconSceneLogsByBeaconSceneId);
router.get('/user/:userId', getBeaconSceneLogsByUserId);

module.exports = router;