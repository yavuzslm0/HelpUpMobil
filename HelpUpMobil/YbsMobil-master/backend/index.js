//backend/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Veritabanına Başarıyla Bağlanıldı!');
  })
  .catch((err) => {
    console.error('MongoDB Bağlantı Hatası:', err);
  });

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const assetRoutes = require('./routes/assets');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/reports', reportRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Backend Sunucusu Çalışıyor!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} portunda çalışıyor.`);
});
