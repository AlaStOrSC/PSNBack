const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const { jwtSecret } = require('../config/index');
const { sendWelcomeEmail } = require('../services/emailService');

const register = async ({ username, email, password, phone, city }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new Error('El usuario o correo electrónico ya existe');
  }

  const user = new User({ username, email, password, phone, city });
  await user.save();
  await sendWelcomeEmail(username, email);

  const token = jwt.sign({ userId: user._id, role: user.role, username: user.username }, jwtSecret, { expiresIn: '100d' });

  return {
    user: {
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      city: user.city,
      profilePicture: user.profilePicture,
      role: user.role,
      score: user.score,
      matchesWon: user.matchesWon,
      matchesLost: user.matchesLost,
      matchesDrawn: user.matchesDrawn,
      totalMatches: user.totalMatches,
    },
    token
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Correo electrónico o contraseña incorrectos');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Correo electrónico o contraseña incorrectos');
  }

  const token = jwt.sign({ userId: user._id, role: user.role, username: user.username }, jwtSecret, { expiresIn: '100d' });

  return {
    user: {
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      city: user.city,
      profilePicture: user.profilePicture,
      role: user.role,
      score: user.score,
      matchesWon: user.matchesWon,
      matchesLost: user.matchesLost,
      matchesDrawn: user.matchesDrawn,
      totalMatches: user.totalMatches,
    },
    token
  };
};

const getUsers = async () => {
  const users = await User.find().select('-password');
  return users.map(user => ({
    userId: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    city: user.city,
    profilePicture: user.profilePicture,
    role: user.role,
    score: user.score,
    matchesWon: user.matchesWon,
    matchesLost: user.matchesLost,
    matchesDrawn: user.matchesDrawn,
    totalMatches: user.totalMatches,
  }));
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  return {
    userId: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    city: user.city,
    profilePicture: user.profilePicture,
    role: user.role,
    score: user.score,
    matchesWon: user.matchesWon,
    matchesLost: user.matchesLost,
    matchesDrawn: user.matchesDrawn,
    totalMatches: user.totalMatches,
  };
};

const updateProfile = async (userId, { phone, email, city, profilePicture }) => {
  try {
    if (!userId) {
      throw new Error('ID de usuario no proporcionado');
    }

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        throw new Error('The email is already in use');
      }
    }

    if (profilePicture && (typeof profilePicture !== 'string' || !profilePicture.startsWith('https://res.cloudinary.com'))) {
      throw new Error('Invalid profile picture URL');
    }

    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (city !== undefined) updateData.city = city;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return {
      userId: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      city: updatedUser.city,
      profilePicture: updatedUser.profilePicture,
      role: updatedUser.role,
      score: updatedUser.score,
      matchesWon: updatedUser.matchesWon,
      matchesLost: updatedUser.matchesLost,
      matchesDrawn: updatedUser.matchesDrawn,
      totalMatches: updatedUser.totalMatches,
    };
  } catch (error) {
    console.error('Error in userService.updateProfile:', {
      message: error.message,
      stack: error.stack,
      userId,
      updateData,
    });
    throw error;
  }
};

const sendFriendRequest = async (userId, recipientId) => {
  const user = await User.findById(userId);
  const recipient = await User.findById(recipientId);
  if (!user || !recipient) {
    throw new Error('Usuario o receptor no encontrado');
  }

  if (userId === recipientId) {
    throw new Error('No puedes enviarte una solicitud de amistad a ti mismo');
  }

  const existingRequest = await Friendship.findOne({
    $or: [
      { requester: userId, recipient: recipientId },
      { requester: recipientId, recipient: userId },
    ],
  });
  if (existingRequest) {
    if (existingRequest.status === 'accepted') {
      throw new Error('Ya son amigos');
    } else if (existingRequest.status === 'pending') {
      throw new Error('Ya hay una solicitud de amistad pendiente');
    } else if (existingRequest.status === 'rejected') {
      await Friendship.deleteOne({ _id: existingRequest._id });
    }
  }

  const friendship = new Friendship({
    requester: userId,
    recipient: recipientId,
    status: 'pending',
  });
  await friendship.save();

  return friendship;
};

const acceptFriendRequest = async (userId, requesterId) => {
  const friendship = await Friendship.findOne({
    requester: requesterId,
    recipient: userId,
    status: 'pending',
  });
  if (!friendship) {
    throw new Error('Solicitud de amistad no encontrada o ya procesada');
  }

  friendship.status = 'accepted';
  await friendship.save();

  return friendship;
};

const rejectFriendRequest = async (userId, requesterId) => {
  const friendship = await Friendship.findOne({
    requester: requesterId,
    recipient: userId,
    status: 'pending',
  });
  if (!friendship) {
    throw new Error('Solicitud de amistad no encontrada o ya procesada');
  }

  friendship.status = 'rejected';
  await friendship.save();

  return friendship;
};

const removeFriend = async (userId, friendId) => {
  const friendship = await Friendship.findOne({
    $or: [
      { requester: userId, recipient: friendId },
      { requester: friendId, recipient: userId },
    ],
    status: 'accepted',
  });
  if (!friendship) {
    throw new Error('Relación de amistad no encontrada');
  }

  await Friendship.deleteOne({ _id: friendship._id });
};

const getFriends = async (userId) => {
  const friendships = await Friendship.find({
    $or: [
      { requester: userId },
      { recipient: userId },
    ],
    status: 'accepted',
  }).populate('requester recipient', 'username email profilePicture');

  const friends = friendships.map(friendship => {
    const friend = friendship.requester._id.toString() === userId
      ? friendship.recipient
      : friendship.requester;
    return {
      id: friend._id,
      username: friend.username,
      email: friend.email,
      profilePicture: friend.profilePicture,
    };
  });

  return friends;
};

const getPendingRequests = async (userId) => {
  const receivedRequests = await Friendship.find({
    recipient: userId,
    status: 'pending',
  }).populate('requester', 'username email profilePicture');

  const sentRequests = await Friendship.find({
    requester: userId,
    status: 'pending',
  }).populate('recipient', 'username email profilePicture');

  const received = receivedRequests.map(request => ({
    requesterId: request.requester._id,
    username: request.requester.username,
    email: request.requester.email,
    profilePicture: request.requester.profilePicture,
    createdAt: request.createdAt,
  }));

  const sent = sentRequests.map(request => ({
    recipientId: request.recipient._id,
    username: request.recipient.username,
    email: request.recipient.email,
    profilePicture: request.recipient.profilePicture,
    createdAt: request.createdAt,
  }));

  return { received, sent };
};

module.exports = {
  register,
  login,
  getUsers,
  getUserProfile,
  updateProfile,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
};