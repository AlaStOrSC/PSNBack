const messageService = require('../services/messageService');

const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await messageService.getConversations(userId);
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener conversaciones', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const otherUserId = req.params.userId;
    const messages = await messageService.getMessages(userId, otherUserId);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mensajes', error: error.message });
  }
};

module.exports = { getConversations, getMessages };