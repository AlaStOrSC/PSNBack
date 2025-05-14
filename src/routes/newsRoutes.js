const express = require('express');
const router = express.Router();
const { getPadelNews } = require('../controllers/newsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware(), getPadelNews);

module.exports = router;