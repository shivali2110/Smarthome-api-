const express = require('express');
const router = express.Router();
const { getAllSceneLogs, getSceneLogsBySceneId, getSceneLogsByUserId } = require('../controllers/logController');

router.get('/all', getAllSceneLogs);
router.get('/scene/:sceneId', getSceneLogsBySceneId);
router.get('/user/:userId', getSceneLogsByUserId);

module.exports = router;
