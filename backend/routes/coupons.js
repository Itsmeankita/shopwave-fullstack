const express = require('express');
const db = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/coupons
router.get('/', (req, res) => {
  res.json(db.get('coupons').value());
});

// POST /api/coupons/apply { code }
router.post('/apply', (req, res) => {
  const { code } = req.body;
  const coupon = db.get('coupons').find({ code: (code || '').toUpperCase() }).value();
  if (!coupon) return res.status(404).json({ error: 'Invalid promo code.' });
  res.json(coupon);
});

// POST /api/coupons (admin only)
router.post('/', verifyToken, requireAdmin, (req, res) => {
  const { code, pct } = req.body;
  if (!code || !pct) return res.status(400).json({ error: 'Code and percentage are required.' });
  const coupon = { code: code.toUpperCase(), pct: +pct };
  db.get('coupons').push(coupon).write();
  res.status(201).json(coupon);
});

// DELETE /api/coupons/:code (admin only)
router.delete('/:code', verifyToken, requireAdmin, (req, res) => {
  db.get('coupons').remove({ code: req.params.code.toUpperCase() }).write();
  res.json({ success: true });
});

module.exports = router;
