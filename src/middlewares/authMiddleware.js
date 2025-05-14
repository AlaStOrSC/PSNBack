const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/index');

const authMiddleware = (requiredRole) => {
  return (req, res, next) => {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token de autenticación' });
      }

      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;


      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Token inválido o expirado', error: error.message });
    }
  };
};

module.exports = authMiddleware;