const express = require('express');
const router = express.Router();
const { uploadProfilePicture } = require('../controllers/fileController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../services/fileService');
const multer = require('multer');

const handleMulterError = (err, req, res, next) => {
    console.log('Error en multer:', err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Error de subida: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  };

router.post('/upload-profile-picture', authMiddleware(), upload, handleMulterError, uploadProfilePicture);

module.exports = router;