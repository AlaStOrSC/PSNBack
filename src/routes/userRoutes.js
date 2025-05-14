const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getUsers,
  getUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  logout,
  getPendingRequestsCount,
} = require('../controllers/userController');
const {
  validateResult,
  registerValidations,
  loginValidations,
  sendFriendRequestValidations,
  friendActionValidations,
  removeFriendValidations,
} = require('../validations/userValidations');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', registerValidations, validateResult, register);
router.post('/login', loginValidations, validateResult, login);
router.post('/logout', authMiddleware(), logout);

router.get('/', authMiddleware(), getUsers);
router.get('/profile', authMiddleware(), getUserProfile);

router.post(
  '/friends/request/:recipientId',
  authMiddleware(),
  sendFriendRequestValidations,
  validateResult,
  sendFriendRequest
);
router.put(
  '/friends/accept/:requesterId',
  authMiddleware(),
  friendActionValidations,
  validateResult,
  acceptFriendRequest
);
router.put(
  '/friends/reject/:requesterId',
  authMiddleware(),
  friendActionValidations,
  validateResult,
  rejectFriendRequest
);
router.delete(
  '/friends/:friendId',
  authMiddleware(),
  removeFriendValidations,
  validateResult,
  removeFriend
);
router.get('/friends', authMiddleware(), getFriends);
router.get('/friends/requests', authMiddleware(), getPendingRequests);
router.get('/friends/requests/count', authMiddleware(), getPendingRequestsCount);

module.exports = router;