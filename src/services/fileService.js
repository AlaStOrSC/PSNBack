const cloudinary = require('../config/cloudinary');

const uploadProfilePicture = async (file, userId) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'psn/profile-pictures',
          resource_type: 'image',
          public_id: `user_${userId}_${Date.now()}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    return result.secure_url;
  } catch (error) {
    throw new Error('Error al subir la imagen a Cloudinary: ' + error.message);
  }
};

module.exports = { uploadProfilePicture };