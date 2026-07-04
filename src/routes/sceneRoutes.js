const express = require('express');
const router = express.Router();
const {
    getAllScenes,
    getSceneById,
    createScene,
    updateScene,
    deleteScene
} = require('../controllers/sceneController');

router.get('/all', getAllScenes);
router.get('/:id', getSceneById);
router.post('/', createScene);
router.put('/update/:id', updateScene);
router.delete('/delete/:id', deleteScene);

module.exports = router;
