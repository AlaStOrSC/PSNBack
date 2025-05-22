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
        console.log('No se ha proporcionado token');
        return res.status(401).json({ message: 'No se proporcionó un token de autenticación' });
      }

      const decoded = jwt.verify(token, jwtSecret);
      console.log('Token decodificado:', decoded);

      req.user = {
        id: decoded.id || decoded._id || decoded.userId,
        role: decoded.role,
        username: decoded.username,
      };

      if (!req.user.id) {
        console.error('El payload del token no contiene id, _id, ni userId:', decoded);
        return res.status(401).json({ message: 'El token no contiene un ID de usuario válido' });
      }

      if (requiredRole && req.user.role !== requiredRole) {
        console.log('Acceso denegado: rol insuficiente', req.user.role, requiredRole);
        return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador' });
      }

      next();
    } catch (error) {
      console.error('Error en authMiddleware:', {
        message: error.message,
        token: req.headers.authorization?.split(' ')[1],
      });
      return res.status(401).json({ message: 'Token inválido o expirado', error: error.message });
    }
  };
};

module.exports = authMiddleware;