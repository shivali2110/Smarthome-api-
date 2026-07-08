const express = require('express');
const router = express.Router();
const { getAllActivityLogs, getActivityLogsByUserId, getActivityLogsBySwitchId } = require('../controllers/logController');

router.get('/all', getAllActivityLogs);
router.get('/user/:userId', getActivityLogsByUserId);
router.get('/switch/:switchId', getActivityLogsBySwitchId);

module.exports = router;
