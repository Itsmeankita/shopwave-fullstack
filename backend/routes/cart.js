const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/cart — current user's server-synced cart
router.get('/', (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value();
  res.json(user?.cart || []);
});

// PUT /api/cart — replace entire cart (used to sync from client on login / on every change)
router.put('/', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array.' });
  db.get('users').find({ id: req.user.id }).assign({ cart: items }).write();
  res.json({ success: true, cart: items });
});

// DELETE /api/cart — clear cart (used after checkout)
router.delete('/', (req, res) => {
  db.get('users').find({ id: req.user.id }).assign({ cart: [] }).write();
  res.json({ success: true });
});

module.exports = router;
