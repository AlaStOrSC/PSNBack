const fetch = require('node-fetch');

const fetchPadelNews = async () => {
  const apiKey = '401b2fbf75414816b67c3f9578599117';
  const url = `https://newsapi.org/v2/everything?q=padel&language=es&sortBy=publishedAt&pageSize=4&apiKey=${apiKey}`;

  try {
    console.log('Realizando solicitud a NewsAPI:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PadelSocialNetwork/1.0',
      },
    });
    console.log('Respuesta de NewsAPI:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Datos obtenidos de NewsAPI:', data);
    return data.articles;
  } catch (error) {
    console.error('Error obteniendo las noticias:', error);
    throw new Error(`Error al obtener las noticias: ${error.message}`);
  }
};

module.exports = { fetchPadelNews };