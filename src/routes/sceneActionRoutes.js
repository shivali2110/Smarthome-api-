const express = require('express');
const router = express.Router();
const { getAllSceneActions, getSceneActionById, getSceneActionsBySceneId, createSceneAction, updateSceneAction, deleteSceneAction } = require('../controllers/sceneActionController');

router.get('/all', getAllSceneActions);
router.get('/scene/:sceneId', getSceneActionsBySceneId);
router.get('/:id', getSceneActionById);
router.post('/', createSceneAction);
router.put('/update/:id', updateSceneAction);
router.delete('/delete/:id', deleteSceneAction);

module.exports = router;
