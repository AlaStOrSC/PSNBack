const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const User = require('../models/User');

// Determinar la ruta base según el entorno
const UPLOADS_BASE_PATH = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/uploads'
  : path.join(__dirname, '../uploads');

const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOADS_BASE_PATH, { recursive: true });
    console.log('Carpeta uploads creada o ya existe:', UPLOADS_BASE_PATH);
    await fs.access(UPLOADS_BASE_PATH, fs.constants.W_OK);
    console.log('Permisos de escritura verificados para:', UPLOADS_BASE_PATH);
  } catch (error) {
    console.error('Error al crear o acceder a la carpeta uploads:', error);
    throw new Error(`No se pudo crear o acceder a la carpeta uploads: ${error.message}`);
  }
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureUploadDir();
      console.log('Guardando archivo en:', UPLOADS_BASE_PATH);
      cb(null, UPLOADS_BASE_PATH);
    } catch (error) {
      console.error('Error en multer destination:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      console.log('Nombre del archivo generado:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Error al generar nombre del archivo:', error);
      cb(error);
    }
  },
});

const fileFilter = (req, file, cb) => {
  try {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png)'));
    }
  } catch (error) {
    console.error('Error en fileFilter:', error);
    cb(error);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 104 },
  fileFilter: fileFilter,
}).single('profilePicture');

const uploadProfilePicture = async (userId, file, protocol, host) => {
  console.log('Iniciando uploadProfilePicture en fileService...');
  console.log('userId:', userId);
  console.log('file:', file);

  if (!file) {
    throw new Error('Archivo no proporcionado');
  }

  try {
    const user = await User.findById(userId);
    console.log('Usuario encontrado:', user);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const filename = file.filename;
    const url = `https://${host}/uploads/${filename}`;
    console.log('URL generada:', url);

    if (user.profilePicture) {
      const oldFilename = user.profilePicture.split('/').pop();
      await deleteFile(oldFilename);
    }

    user.profilePicture = url;
    await user.save();
    console.log('Usuario actualizado con nueva foto de perfil:', user);

    return url;
  } catch (error) {
    console.error('Error en uploadProfilePicture:', error);
    throw new Error(`Error al procesar la foto de perfil: ${error.message}`);
  }
};

const deleteFile = async (filename) => {
  const filePath = path.join(UPLOADS_BASE_PATH, filename);
  console.log('Intentando eliminar archivo:', filePath);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error al eliminar el archivo:', error);
      throw new Error(`Error al eliminar el archivo ${filename}: ${error.message}`);
    }
  }
};

module.exports = { uploadProfilePicture, deleteFile, upload };