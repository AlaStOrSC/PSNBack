const { body, param, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Errores de validación', errors: errors.array() });
  }
  next();
};

const registerValidations = [
  body('username')
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isString().withMessage('El nombre de usuario debe ser una cadena')
    .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres')
    .trim(),
  body('email')
    .notEmpty().withMessage('El correo electrónico es obligatorio')
    .isEmail().withMessage('Por favor, ingresa un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const loginValidations = [
  body('email')
    .notEmpty().withMessage('El correo electrónico es obligatorio')
    .isEmail().withMessage('Por favor, ingresa un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
];

const sendFriendRequestValidations = [
  param('recipientId')
    .isMongoId().withMessage('El ID del destinatario debe ser un ObjectId válido'),
];

const friendActionValidations = [
  param('requesterId')
    .isMongoId().withMessage('El ID del solicitante debe ser un ObjectId válido'),
];

const removeFriendValidations = [
  param('friendId')
    .isMongoId().withMessage('El ID del amigo debe ser un ObjectId válido'),
];

module.exports = {
  validateResult,
  registerValidations,
  loginValidations,
  sendFriendRequestValidations,
  friendActionValidations,
  removeFriendValidations,
};

