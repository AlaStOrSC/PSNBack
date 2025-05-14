const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const { jwtSecret } = require('../config/index');

const clients = new Map();

const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    let token = null;
    const cookies = req.headers.cookie;

    if (cookies) {
      const cookieObj = cookies.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      token = cookieObj.token;
    }

    if (!token) {
      console.error('No se proporcionó un token de autenticación');
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No se proporcionó un token de autenticación',
      }));
      ws.close();
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      const userId = decoded.userId;

      ws.userId = userId;
      clients.set(userId, ws);

      ws.send(JSON.stringify({
        type: 'auth_success',
        message: 'Conexión autenticada',
      }));
    } catch (error) {
      console.error('Error verificando token:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Token inválido o expirado',
      }));
      ws.close();
      return;
    }

    ws.on('message', async (message) => {
      try {
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

          const receiverSocket = clients.get(receiverId);
          if (receiverSocket) {
            receiverSocket.send(JSON.stringify({
              type: 'receiveMessage',
              senderId,
              content,
              timestamp: newMessage.timestamp,
            }));
          }
        } else if (data.type === 'markAsRead') {
          const { userId } = data;
          const receiverId = ws.userId;

          await Message.updateMany(
            { sender: userId, receiver: receiverId, isRead: false },
            { isRead: true }
          );

          const senderSocket = clients.get(userId);
          if (senderSocket) {
            senderSocket.send(JSON.stringify({
              type: 'messagesRead',
              userId: receiverId,
            }));
          }
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Tipo de mensaje no soportado',
          }));
        }
      } catch (error) {
        console.error('Error procesando mensaje:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error procesando mensaje',
        }));
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`Cliente desconectado: ${ws.userId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
    });
  });
};

module.exports = { initializeWebSocket, clients };