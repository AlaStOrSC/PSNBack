const nodemailer = require('nodemailer');
const { emailUser, emailPass } = require('./index'); 

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error al conectar con el servidor de correo:', error);
  } else {
    console.log('Conectado al servidor de correo');
  }
});

module.exports = transporter;