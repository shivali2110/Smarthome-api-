const express = require('express');
const router = express.Router();
const {
    getAllSpaces,
    getSpaceById,
    createSpace,
    updateSpace,
    deleteSpace,
      getSpaceFullData   
} = require('../controllers/spaceController');

router.get('/all', getAllSpaces);
router.get('/:id/full', getSpaceFullData); 
router.get('/:id', getSpaceById);
router.post('/', createSpace);
router.put('/update/:id', updateSpace);
router.delete('/delete/:id', deleteSpace);

module.exports = router;