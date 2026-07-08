const express = require('express');
const router = express.Router();
const { getAllLoginLogs, getLoginLogsByUserId } = require('../controllers/logController');

router.get('/all', getAllLoginLogs);
router.get('/user/:userId', getLoginLogsByUserId);

module.exports = router;
