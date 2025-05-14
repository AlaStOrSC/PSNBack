const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/index');

const authMiddleware = (requiredRole) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.token;
      console.log('Headers recibidos:', req.headers);
      console.log('Authorization header:', authHeader);
      console.log('Cookie token:', cookieToken);
      console.log('JWT_SECRET:', jwtSecret);

      let token;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Token extraído de Authorization:', token);
      } else if (cookieToken) {
        token = cookieToken;
        console.log('Token extraído de cookie:', token);
      }

      if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No se proporcionó un token de autenticación' });
      }

      const decoded = jwt.verify(token, jwtSecret);
      console.log('Token decodificado:', decoded);
      req.user = decoded;

      if (requiredRole && decoded.role !== requiredRole) {
        console.log('Acceso denegado: rol insuficiente', decoded.role, requiredRole);
        return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador' });
      }

      next();
    } catch (error) {
      console.error('Error en authMiddleware:', error.message);
      res.status(401).json({ message: 'Token inválido o expirado', error: error.message });
    }
  };
};

module.exports = authMiddleware;