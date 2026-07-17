const express = require('express');
const db = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const orders = db.get('orders').value();
  const products = db.get('products').value();
  const users = db.get('users').value();
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  const days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
  });
  const dayTotals = days.map(d => {
    const key = d.toLocaleDateString();
    return orders.filter(o => o.date === key).reduce((s, o) => s + o.total, 0);
  });

  res.json({
    revenue,
    totalOrders: orders.length,
    totalUsers: users.length,
    lowStockCount: products.filter(p => p.stock > 0 && p.stock <= 5).length,
    outOfStockCount: products.filter(p => p.stock === 0).length,
    weeklySales: days.map((d, i) => ({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), total: dayTotals[i] }))
  });
});

// GET /api/admin/orders — all orders across all users
router.get('/orders', (req, res) => {
  res.json(db.get('orders').value().slice().reverse());
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.get('users').value().map(({ password, ...rest }) => rest);
  res.json(users);
});

module.exports = router;
