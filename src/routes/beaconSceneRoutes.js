const express = require('express');
const router = express.Router();
const {
    getAllBeaconScenes,
    getBeaconSceneById,
    createBeaconScene,
    updateBeaconScene,
    deleteBeaconScene
} = require('../controllers/beaconSceneController');

router.get('/all', getAllBeaconScenes);
router.get('/:id', getBeaconSceneById);
router.post('/', createBeaconScene);
router.put('/update/:id', updateBeaconScene);
router.delete('/delete/:id', deleteBeaconScene);

module.exports = router;
