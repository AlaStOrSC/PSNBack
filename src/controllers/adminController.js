const adminService = require('../services/adminService');

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    const currentUserId = req.user.userId;

    await adminService.updateUser(userId, updates, currentUserId);
    res.status(200).json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(error.message.includes('no encontrado') ? 404 : 400).json({
      message: 'Error al actualizar el usuario',
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.userId;

    await adminService.deleteUser(userId, currentUserId);
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(error.message.includes('no encontrado') ? 404 : 400).json({
      message: 'Error al eliminar el usuario',
      error: error.message,
    });
  }
};

module.exports = {
  updateUser,
  deleteUser,
};