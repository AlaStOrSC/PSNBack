const transporter = require('../config/emailing'); 
const {emailUser} = require('../config/index');

const sendWelcomeEmail = async (username, email) => {
  try {
    const mailOptions = {
      from: `"Red Social de Pádel" <${emailUser}>`,
      to: email,
      subject: '¡Bienvenido a nuestra Red Social de Pádel!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <h1 style="color: #2c3e50;">Bienvenido ${username}!</h1>
          <p style="color: #34495e;">Te has registrado en nuestra red social de Pádel.</p>
          <p style="color: #34495e;">Aquí podrás encontrar gente con la que jugar de tu ciudad y de tu mismo nivel, suma puntos y asciende en el ranking.</p>
          <p style="font-weight: bold; color: #e74c3c;">¡La competición te espera!</p>
          <footer style="margin-top: 20px; color: #7f8c8d;">
            <p>Equipo de PadelMania</p>
          </footer>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de bienvenida enviado a ${email}`);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('No se pudo enviar el correo de bienvenida');
  }
};

module.exports = { sendWelcomeEmail };