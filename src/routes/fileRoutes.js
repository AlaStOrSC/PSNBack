const express = require('express');
const router = express.Router();
const { uploadProfilePicture } = require('../controllers/fileController');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-profile-picture', authMiddleware(), upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;