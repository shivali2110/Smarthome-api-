const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadFile } = require('../controllers/uploadController');

// Multer config — temp folder me save karo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Sirf JSON files allow karo
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/json' ||
        path.extname(file.originalname) === '.json') {
        cb(null, true);
    } else {
        cb(new Error('Only JSON files are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter });

router.post('/', upload.single('file'), uploadFile);

module.exports = router;
