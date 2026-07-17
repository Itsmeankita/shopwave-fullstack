const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'shopwave_dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, referral } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

  const existing = db.get('users').find({ email: email.toLowerCase() }).value();
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  let bonusPoints = 100;
  if (referral) {
    const referrer = db.get('users').find({ referral }).value();
    if (referrer) bonusPoints = 200;
  }

  const hashed = bcrypt.hashSync(password, 10);
  const newUser = {
    id: Date.now(),
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: 'user',
    points: bonusPoints,
    referral: 'SW-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    addresses: [],
    cart: [],
    createdAt: new Date().toISOString()
  };
  db.get('users').push(newUser).write();

  const token = signToken(newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.get('users').find({ email: email.toLowerCase() }).value();
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const match = bcrypt.compareSync(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = signToken(user);
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ---- Address book ----
// POST /api/auth/addresses
router.post('/addresses', verifyToken, (req, res) => {
  const { name, phone, line, city, pin } = req.body;
  if (!name || !phone || !line || !city || !pin) return res.status(400).json({ error: 'All address fields are required.' });
  const address = { id: Date.now(), name, phone, line, city, pin };
  db.get('users').find({ id: req.user.id }).get('addresses').push(address).write();
  res.status(201).json(address);
});

// DELETE /api/auth/addresses/:addressId
router.delete('/addresses/:addressId', verifyToken, (req, res) => {
  const user = db.get('users').find({ id: req.user.id });
  const addresses = user.get('addresses').value().filter(a => a.id !== +req.params.addressId);
  user.set('addresses', addresses).write();
  res.json({ success: true });
});

// ---- Forgot / Reset password ----
// NOTE: no real email service is connected in this demo. In production this endpoint
// would email a reset link instead of returning the code directly in the response.
const resetCodes = {}; // { email: { code, expiresAt } } — in-memory, resets on server restart

// POST /api/auth/forgot-password { email }
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.get('users').find({ email: (email || '').toLowerCase() }).value();
  if (!user) return res.status(404).json({ error: 'No account found with that email.' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes[user.email] = { code, expiresAt: Date.now() + 10 * 60 * 1000 }; // 10 min

  // DEMO MODE: return the code directly since no email/SMS provider is wired up.
  res.json({ message: 'Reset code generated (demo mode — no real email sent).', demoCode: code });
});

// POST /api/auth/reset-password { email, code, newPassword }
router.post('/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  const entry = resetCodes[(email || '').toLowerCase()];
  if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired reset code.' });
  }
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

  const userQ = db.get('users').find({ email: email.toLowerCase() });
  userQ.assign({ password: bcrypt.hashSync(newPassword, 10) }).write();
  delete resetCodes[email.toLowerCase()];
  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

module.exports = router;
