const userService = require('../services/userService');
const Friendship = require('../models/Friendship');

const register = async (req, res) => {
  try {
    await userService.register(req.body);
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(error.message.includes('ya existe') ? 400 : 500).json({
      message: 'Error al registrar el usuario',
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const token = await userService.login(req.body);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 3600000,
      path: '/',
    });

    res.status(200).json({ message: 'Inicio de sesión exitoso', token });
    
  } catch (error) {
    res.status(error.message.includes('incorrectos') ? 401 : 500).json({
      message: 'Error al iniciar sesión',
      error: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar usuarios', error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.userId);
    res.json(user);
  } catch (error) {
    res.status(error.message.includes('no encontrado') ? 404 : 500).json({
      message: 'Error al obtener el perfil del usuario',
      error: error.message,
    });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    await userService.sendFriendRequest(req.user.userId, req.params.recipientId);
    res.status(200).json({ message: 'Solicitud de amistad enviada exitosamente' });
  } catch (error) {
    res.status(error.message.includes('no encontrado') || error.message.includes('a ti mismo') || error.message.includes('Ya son amigos') || error.message.includes('pendiente') ? 400 : 500).json({
      message: 'Error al enviar solicitud de amistad',
      error: error.message,
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    await userService.acceptFriendRequest(req.user.userId, req.params.requesterId);
    res.status(200).json({ message: 'Solicitud de amistad aceptada exitosamente' });
  } catch (error) {
    res.status(error.message.includes('no encontrada') ? 404 : 500).json({
      message: 'Error al aceptar solicitud de amistad',
      error: error.message,
    });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    await userService.rejectFriendRequest(req.user.userId, req.params.requesterId);
    res.status(200).json({ message: 'Solicitud de amistad rechazada exitosamente' });
  } catch (error) {
    res.status(error.message.includes('no encontrada') ? 404 : 500).json({
      message: 'Error al rechazar solicitud de amistad',
      error: error.message,
    });
  }
};

const removeFriend = async (req, res) => {
  try {
    await userService.removeFriend(req.user.userId, req.params.friendId);
    res.status(200).json({ message: 'Amigo eliminado exitosamente' });
  } catch (error) {
    res.status(error.message.includes('no encontrada') ? 404 : 500).json({
      message: 'Error al eliminar amigo',
      error: error.message,
    });
  }
};

const getFriends = async (req, res) => {
  try {
    const friends = await userService.getFriends(req.user.userId);
    res.status(200).json(friends);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar amigos', error: error.message });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await userService.getPendingRequests(req.user.userId);
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar solicitudes pendientes', error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    path: '/',
  });
  res.status(200).json({ message: 'Cierre de sesión exitoso' });
};

const getPendingRequestsCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pendingCount = await Friendship.countDocuments({
      recipient: userId,
      status: 'pending',
    });

    res.status(200).json({ pendingCount });
  } catch (error) {
    console.error('Error al obtener el conteo de solicitudes pendientes:', error);
    res.status(500).json({ message: 'Error al obtener el conteo de solicitudes pendientes', error: error.message });
  }
};

module.exports = {
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
};