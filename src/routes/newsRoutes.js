const express = require('express');
const router = express.Router();
const { getPadelNews } = require('../controllers/newsController');


router.get('/', getPadelNews);

module.exports = router;