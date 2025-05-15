const fetch = require('node-fetch');
const { parse, differenceInSeconds } = require('date-fns');

async function getWeather(city, date, time) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY || '1b7d1bdc3706f255a1b2d668ba6c27b9';
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=es`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('Respuesta de la API del tiempo:', data);

    if (!data.list) {
      console.error('No se encontró información del clima.');
      return { weather: 'No disponible', rainWarning: false };
    }

    const targetDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());

    const forecast = data.list.find((item) => {
      const forecastTime = parse(item.dt_txt, 'yyyy-MM-dd HH:mm:ss', new Date());
      return Math.abs(differenceInSeconds(forecastTime, targetDateTime)) < 10800;
    });

    if (!forecast) {
      console.error('No se encontró pronóstico para la fecha y hora especificadas.');
      return { weather: 'No disponible aún', rainWarning: false };
    }

    const temp = forecast.main.temp;
    const weatherDesc = forecast.weather[0].description;
    const rainProbability = forecast.pop || 0;

    return {
      weather: `${weatherDesc}, ${temp}°C`,
      rainWarning: rainProbability > 0.2,
    };
  } catch (error) {
    console.error('Error obteniendo el clima:', error);
    return { weather: 'Error al obtener', rainWarning: false };
  }
}

module.exports = { getWeather };