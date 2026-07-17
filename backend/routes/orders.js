const express = require('express');
const db = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — place a new order
router.post('/', verifyToken, (req, res) => {
  const { items, address, payMethod, giftwrap, discountPct, promoCode } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty.' });
  if (!address) return res.status(400).json({ error: 'Delivery address is required.' });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const wrapFee = giftwrap ? 4.99 : 0;
  const discount = subtotal * ((discountPct || 0) / 100);
  const tax = (subtotal - discount) * 0.05;
  const total = +(subtotal + shipping + wrapFee - discount + tax).toFixed(2);

  // reduce stock
  items.forEach(item => {
    const p = db.get('products').find({ id: item.id });
    const cur = p.value();
    if (cur) p.assign({ stock: Math.max(0, cur.stock - item.qty) }).write();
  });

  const order = {
    id: 'SW' + Date.now().toString().slice(-8),
    date: new Date().toLocaleDateString(),
    items, total, payMethod, address, giftwrap: !!giftwrap, promoCode: promoCode || null,
    status: 'processing',
    userEmail: req.user.email,
    createdAt: new Date().toISOString()
  };
  db.get('orders').push(order).write();

  // award loyalty points (1 pt per currency unit spent)
  const userQ = db.get('users').find({ id: req.user.id });
  const user = userQ.value();
  if (user) userQ.assign({ points: (user.points || 0) + Math.round(total) }).write();

  res.status(201).json(order);
});

// GET /api/orders — current user's orders
router.get('/', verifyToken, (req, res) => {
  const list = db.get('orders').filter({ userEmail: req.user.email }).value().reverse();
  res.json(list);
});

// GET /api/orders/:id
router.get('/:id', verifyToken, (req, res) => {
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.userEmail !== req.user.email && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized.' });
  res.json(order);
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', verifyToken, (req, res) => {
  const order = db.get('orders').find({ id: req.params.id });
  if (!order.value()) return res.status(404).json({ error: 'Order not found.' });
  if (order.value().userEmail !== req.user.email) return res.status(403).json({ error: 'Not authorized.' });
  order.assign({ status: 'cancelled' }).write();
  res.json(order.value());
});

// PUT /api/orders/:id/status (admin only)
router.put('/:id/status', verifyToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  const order = db.get('orders').find({ id: req.params.id });
  if (!order.value()) return res.status(404).json({ error: 'Order not found.' });
  order.assign({ status }).write();
  res.json(order.value());
});

module.exports = router;
