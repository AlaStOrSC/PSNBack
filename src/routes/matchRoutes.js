const express = require('express');
const router = express.Router();
const { createMatch, getMatches, updateMatch, deleteMatch, saveMatch } = require('../controllers/matchController');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware(), createMatch);
router.get('/', authMiddleware(), getMatches);
router.delete('/:id', authMiddleware(), deleteMatch);
router.put('/:id', authMiddleware('admin'),updateMatch);
router.put('/savematches/:id', authMiddleware(),saveMatch);

module.exports = router;