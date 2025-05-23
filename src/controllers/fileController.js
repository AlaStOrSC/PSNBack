const fileService = require('../services/fileService');

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const url = await fileService.uploadProfilePicture(req.file, req.user.userId);
    res.json({ profilePicture: url });
  } catch (error) {
    console.error('Error en el controlador de subida de imagen:', error);
    res.status(500).json({ error: error.message || 'Error al subir la imagen' });
  }
};

module.exports = { uploadProfilePicture };