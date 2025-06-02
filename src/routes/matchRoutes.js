const express = require('express');
const router = express.Router();
const { createMatch, getMatches, joinMatch, updateMatch, deleteMatch, saveMatch } = require('../controllers/matchController');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware(), createMatch);
router.get('/', authMiddleware(), getMatches);
router.put('/join/:id', authMiddleware(), joinMatch);
router.delete('/:id', authMiddleware(), deleteMatch);
router.put('/:id', authMiddleware(), updateMatch);
router.put('/savematches/:id', authMiddleware(), saveMatch);

module.exports = router;