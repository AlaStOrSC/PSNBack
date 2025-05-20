const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const { jwtSecret } = require('../config/index');
const url = require('url');
const querystring = require('querystring');

const clients = new Map();

const initializeWebSocket = (server) => {
  // Configuración mejorada del servidor WebSocket con verificación de cliente
  const wss = new WebSocket.Server({ 
    server,
    // Añadir verificación de cliente para diagnosticar problemas de CORS
    verifyClient: (info, cb) => {
      const origin = info.origin || info.req.headers.origin;
      const host = info.req.headers.host;
      
      console.log('=== DIAGNÓSTICO DE CONEXIÓN WEBSOCKET ===');
      console.log(`Intento de conexión desde origen: ${origin}`);
      console.log(`Host solicitado: ${host}`);
      console.log('Headers de la solicitud:', JSON.stringify(info.req.headers, null, 2));
      
      // Obtener la URL y parámetros
      const parsedUrl = url.parse(info.req.url);
      console.log(`URL solicitada: ${parsedUrl.pathname}`);
      console.log(`Query string: ${parsedUrl.query}`);
      
      // Lista de orígenes permitidos - ajusta según tus necesidades
      const allowedOrigins = [
        // Orígenes de desarrollo
    'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://padel-social-frontend.onrender.com',
  'http://localhost:5173'
        // Permitir cualquier origen (solo para desarrollo/pruebas)
        // '*'
      ];
      
      // Para desarrollo, puedes permitir todos los orígenes
      const allowAllOrigins = true; // Cambia a false en producción
      
      if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
        console.log('✅ Origen permitido');
        cb(true);
      } else {
        console.log(`❌ Origen rechazado: ${origin} no está en la lista de permitidos`);
        cb(false, 403, 'Origen no permitido');
      }
    }
  });

  // Mejorar el logging de eventos del servidor
  wss.on('listening', () => {
    console.log(`Servidor WebSocket escuchando`);
  });

  wss.on('error', (error) => {
    console.error('Error en el servidor WebSocket:', error);
  });

  wss.on('connection', (ws, req) => {
    // Registrar información detallada de la conexión
    const ip = req.socket.remoteAddress;
    console.log(`Nueva conexión WebSocket desde IP: ${ip}`);
    console.log('Headers completos:', JSON.stringify(req.headers, null, 2));
    
    console.log('req.url:', req.url);
    const parsedUrl = url.parse(req.url);
    const queryParams = querystring.parse(parsedUrl.query || '');
    console.log('queryParams:', queryParams);
    const token = queryParams.token;

    // Añadir un ping periódico para mantener la conexión activa
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
      console.log(`Pong recibido de cliente ${ws.userId || 'no autenticado'}`);
    });

    if (!token) {
      console.error('No se proporcionó un token de autenticación');
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No se proporcionó un token de autenticación',
      }));
      ws.close(1008, 'No token provided');
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Token decodificado:', decoded);
      const userId = decoded.userId;

      ws.userId = userId;
      clients.set(userId, ws);

      ws.send(JSON.stringify({
        type: 'auth_success',
        message: 'Conexión autenticada',
      }));
      console.log(`Cliente autenticado: ${userId}`);
    } catch (error) {
      console.error('Error verificando token:', error.message);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Token inválido o expirado',
      }));
      ws.close(1008, 'Invalid or expired token');
      return;
    }

    ws.on('message', async (message) => {
      try {
        console.log('Mensaje recibido:', message.toString());
        const data = JSON.parse(message.toString());

        if (data.type === 'message') {
          const { receiverId, content } = data;
          const senderId = ws.userId;

          const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content,
            timestamp: new Date(),
            isRead: false,
          });
          await newMessage.save();
          console.log(`Mensaje guardado: ${senderId} -> ${receiverId}`);

          const receiverSocket = clients.get(receiverId);
          if (receiverSocket) {
            receiverSocket.send(JSON.stringify({
              type: 'receiveMessage',
              senderId,
              content,
              timestamp: newMessage.timestamp,
            }));
            console.log(`Mensaje enviado a ${receiverId}`);
          } else {
            console.log(`Receptor ${receiverId} no está conectado`);
          }
        } else if (data.type === 'markAsRead') {
          const { userId } = data;
          const receiverId = ws.userId;

          await Message.updateMany(
            { sender: userId, receiver: receiverId, isRead: false },
            { isRead: true }
          );
          console.log(`Mensajes marcados como leídos: ${userId} -> ${receiverId}`);

          const senderSocket = clients.get(userId);
          if (senderSocket) {
            senderSocket.send(JSON.stringify({
              type: 'messagesRead',
              userId: receiverId,
            }));
            console.log(`Notificado a ${userId} que los mensajes fueron leídos`);
          }
        } else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          console.log(`Respondiendo con pong al cliente ${ws.userId}`);
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Tipo de mensaje no soportado',
          }));
          console.log('Tipo de mensaje no soportado:', data.type);
        }
      } catch (error) {
        console.error('Error procesando mensaje:', error);
        console.error('Stack trace:', error.stack);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error procesando mensaje',
          details: error.message
        }));
      }
    });

    ws.on('close', (code, reason) => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`Cliente desconectado: ${ws.userId}, Código: ${code}, Razón: ${reason || 'No especificada'}`);
      }
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket para cliente:', ws.userId || 'no autenticado');
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    });
  });

  // Implementar ping periódico para mantener conexiones activas
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log(`Terminando conexión inactiva para cliente: ${ws.userId || 'no autenticado'}`);
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping(() => {});
    });
  }, 30000); // Ping cada 30 segundos

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
};

// Función de diagnóstico que puedes llamar desde otras partes de tu aplicación
const diagnosticInfo = () => {
  const info = {
    activeConnections: clients.size,
    clients: Array.from(clients.keys()),
    timestamp: new Date().toISOString()
  };
  console.log('Diagnóstico WebSocket:', JSON.stringify(info, null, 2));
  return info;
};

module.exports = { initializeWebSocket, clients, diagnosticInfo };
// const WebSocket = require('ws');
// const jwt = require('jsonwebtoken');
// const Message = require('../models/Message');
// const { jwtSecret } = require('../config/index');
// const url = require('url');
// const querystring = require('querystring');

// const clients = new Map();

// const initializeWebSocket = (server) => {
//   const wss = new WebSocket.Server({ server });

//   wss.on('connection', (ws, req) => {
//     console.log('req.url:', req.url);
//     const parsedUrl = url.parse(req.url);
//     const queryParams = querystring.parse(parsedUrl.query || '');
//     console.log('queryParams:', queryParams);
//     const token = queryParams.token;

//     if (!token) {
//       console.error('No se proporcionó un token de autenticación');
//       ws.send(JSON.stringify({
//         type: 'error',
//         message: 'No se proporcionó un token de autenticación',
//       }));
//       ws.close(1008, 'No token provided');
//       return;
//     }

//     try {
//       const decoded = jwt.verify(token, jwtSecret);
//       console.log('Token decodificado:', decoded);
//       const userId = decoded.userId;

//       ws.userId = userId;
//       clients.set(userId, ws);

//       ws.send(JSON.stringify({
//         type: 'auth_success',
//         message: 'Conexión autenticada',
//       }));
//       console.log(`Cliente autenticado: ${userId}`);
//     } catch (error) {
//       console.error('Error verificando token:', error.message);
//       ws.send(JSON.stringify({
//         type: 'error',
//         message: 'Token inválido o expirado',
//       }));
//       ws.close(1008, 'Invalid or expired token');
//       return;
//     }

//     ws.on('message', async (message) => {
//       try {
//         console.log('Mensaje recibido:', message.toString());
//         const data = JSON.parse(message.toString());

//         if (data.type === 'message') {
//           const { receiverId, content } = data;
//           const senderId = ws.userId;

//           const newMessage = new Message({
//             sender: senderId,
//             receiver: receiverId,
//             content,
//             timestamp: new Date(),
//             isRead: false,
//           });
//           await newMessage.save();
//           console.log(`Mensaje guardado: ${senderId} -> ${receiverId}`);

//           const receiverSocket = clients.get(receiverId);
//           if (receiverSocket) {
//             receiverSocket.send(JSON.stringify({
//               type: 'receiveMessage',
//               senderId,
//               content,
//               timestamp: newMessage.timestamp,
//             }));
//             console.log(`Mensaje enviado a ${receiverId}`);
//           } else {
//             console.log(`Receptor ${receiverId} no está conectado`);
//           }
//         } else if (data.type === 'markAsRead') {
//           const { userId } = data;
//           const receiverId = ws.userId;

//           await Message.updateMany(
//             { sender: userId, receiver: receiverId, isRead: false },
//             { isRead: true }
//           );
//           console.log(`Mensajes marcados como leídos: ${userId} -> ${receiverId}`);

//           const senderSocket = clients.get(userId);
//           if (senderSocket) {
//             senderSocket.send(JSON.stringify({
//               type: 'messagesRead',
//               userId: receiverId,
//             }));
//             console.log(`Notificado a ${userId} que los mensajes fueron leídos`);
//           }
//         } else if (data.type === 'ping') {
//           ws.send(JSON.stringify({ type: 'pong' }));
//           console.log(`Respondiendo con pong al cliente ${ws.userId}`);
//         } else {
//           ws.send(JSON.stringify({
//             type: 'error',
//             message: 'Tipo de mensaje no soportado',
//           }));
//           console.log('Tipo de mensaje no soportado:', data.type);
//         }
//       } catch (error) {
//         console.error('Error procesando mensaje:', error);
//         ws.send(JSON.stringify({
//           type: 'error',
//           message: 'Error procesando mensaje',
//         }));
//       }
//     });

//     ws.on('close', (code, reason) => {
//       if (ws.userId) {
//         clients.delete(ws.userId);
//         console.log(`Cliente desconectado: ${ws.userId}, Código: ${code}, Razón: ${reason}`);
//       }
//     });

//     ws.on('error', (error) => {
//       console.error('Error en WebSocket:', error);
//     });
//   });

//   return wss;
// };

// module.exports = { initializeWebSocket, clients };