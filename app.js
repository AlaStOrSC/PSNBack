const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const newsRoutes = require('./src/routes/newsRoutes');
const errorHandler = require('./src/middlewares/errorMiddleware');
const notFoundHandler = require('./src/middlewares/notFoundHandler');
const adminRoutes = require('./src/routes/adminRoutes');
const productRoutes = require('./src/routes/productRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://padel-social-frontend.onrender.com',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origen no permitido'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

const UPLOADS_BASE_PATH = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/uploads'
  : path.join(__dirname, 'Uploads');
app.use('/uploads', express.static(UPLOADS_BASE_PATH));

app.get('/api/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    apiKey: process.env.OPENWEATHERMAP_API_KEY,
  });
});

app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);

app.use('/api', notFoundHandler);
app.use(errorHandler);

module.exports = app;