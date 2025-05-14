const Message = require('../models/Message');

const getConversations = async (userId) => {
  const messages = await Message.find({
    $or: [
      { sender: userId },
      { receiver: userId },
    ],
  })
    .populate('sender', 'username')
    .populate('receiver', 'username')
    .sort({ timestamp: -1 });

  const conversationsMap = new Map();

  for (const message of messages) {
    const otherUserId = message.sender._id.toString() === userId ? message.receiver._id.toString() : message.sender._id.toString();
    const otherUser = message.sender._id.toString() === userId ? message.receiver : message.sender;

    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, {
        userId: otherUserId,
        username: otherUser.username,
        messages: [],
        hasUnread: false,
      });
    }

    const conversation = conversationsMap.get(otherUserId);
    if (conversation.messages.length === 0) {
      conversation.messages.push({
        sender: message.sender._id.toString(),
        receiver: message.receiver._id.toString(),
        content: message.content,
        timestamp: message.timestamp,
      });
    }

    if (!message.isRead && message.receiver._id.toString() === userId) {
      conversation.hasUnread = true;
    }
  }

  return Array.from(conversationsMap.values());
};

const getMessages = async (userId, otherUserId) => {
  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId },
    ],
  }).sort({ timestamp: 1 });

  return messages;
};

module.exports = { getConversations, getMessages };