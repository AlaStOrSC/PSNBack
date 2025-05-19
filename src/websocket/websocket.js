const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const { jwtSecret } = require('../config/index');
const url = require('url');
const querystring = require('querystring');

const clients = new Map();

const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('req.url:', req.url);
    const parsedUrl = url.parse(req.url);
    const queryParams = querystring.parse(parsedUrl.query || '');
    console.log('queryParams:', queryParams);
    const token = queryParams.token;

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
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error procesando mensaje',
        }));
      }
    });

    ws.on('close', (code, reason) => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`Cliente desconectado: ${ws.userId}, Código: ${code}, Razón: ${reason}`);
      }
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
    });
  });

  return wss;
};

module.exports = { initializeWebSocket, clients };