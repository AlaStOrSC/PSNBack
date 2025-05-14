const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

router.put('/users/:id', authMiddleware('admin'), adminController.updateUser);

router.delete('/users/:id', authMiddleware('admin'), adminController.deleteUser);

module.exports = router;