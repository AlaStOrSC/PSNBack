const fileService = require('../services/fileService');

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado o ID no encontrado' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    const userId = req.user.userId;
    const url = await fileService.uploadProfilePicture(userId, req.file, req.protocol, req.get('host'));
    res.status(201).json({ message: 'Foto de perfil subida exitosamente', profilePicture: url });
  } catch (error) {
    console.error('Error al subir la foto de perfil:', error);
    res.status(
      error.message.includes('no encontrado') || error.message.includes('no proporcionado')
        ? 400
        : 500
    ).json({
      error: error.message, 
    });
  }
};

module.exports = { uploadProfilePicture };