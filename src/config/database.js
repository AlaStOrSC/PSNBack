const mongoose = require('mongoose');
const {mongoUri} = require('./index');

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {});
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;