const User = require('../models/User');

const updateUser = async (userId, updates, currentUserId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user._id.toString() === currentUserId) {
    throw new Error('No puedes editarte a ti mismo desde el panel de administración');
  }

  user.username = updates.username || user.username;
  user.email = updates.email || user.email;
  user.role = updates.role || user.role;
  user.phone = updates.phone || user.phone;
  user.city = updates.city || user.city;

  await user.save();
  return user;
};

const deleteUser = async (userId, currentUserId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user._id.toString() === currentUserId) {
    throw new Error('No puedes eliminarte a ti mismo desde el panel de administración');
  }

  await User.deleteOne({ _id: userId });
};

module.exports = {
  updateUser,
  deleteUser,
};