const { fetchPadelNews } = require('../services/newsService');

const getPadelNews = async (req, res) => {
  try {
    const articles = await fetchPadelNews();
    res.status(200).json(articles);
  } catch (error) {
    console.error('Error en el controlador de noticias:', error);
    res.status(500).json({ error: 'Error al obtener las noticias', message: error.message });
  }
};

module.exports = { getPadelNews };