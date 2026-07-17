// ============================================================
// server.js — ShopWave Backend Entry Point
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());               // allow requests from the frontend (any origin — fine for local dev)
app.use(express.json({ limit: '5mb' })); // parse JSON bodies (5mb limit to allow base64 review images)
app.use(morgan('dev'));        // request logging in the terminal

// ---------- ROUTES ----------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/cart', cartRoutes);

// GET /api/categories — list of distinct product categories
app.get('/api/categories', (req, res) => {
  const cats = [...new Set(db.get('products').value().map(p => p.category))];
  res.json(cats);
});

// GET /api/health — simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShopWave API is running', products: db.get('products').size().value() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

async function start() {
  console.log('⏳ Seeding product catalog (fetching real product data)...');
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 ShopWave API running at http://localhost:${PORT}`);
    console.log(`📦 Products seeded: ${db.get('products').size().value()}`);
    console.log(`👤 Admin login: admin@shopwave.com / admin123\n`);
  });
}

start();
