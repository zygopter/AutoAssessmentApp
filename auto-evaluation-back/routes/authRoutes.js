// backend/routes/authRoutes.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('[authRoutes][register] payload:', req.body);
  try {
    const { name, email, password, role } = req.body;

    // 1) check existing
    const existing = await User.findOne({ where: { email } });
    console.log('[authRoutes][register] existing user:', existing ? { id: existing.id, email: existing.email } : null);
    if (existing) {
      console.warn('[authRoutes][register] User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2) hash
    console.log('[auth][register] raw password:', password);
    const salt = await bcrypt.genSalt(10);
    console.log('[auth][register] salt:', salt);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('[auth][register] hashedPassword:', hashedPassword);

    // 3) create
    const user = await User.create({ name, email, password: hashedPassword, role });
    console.log('[authRoutes][register] new user created:', { id: user.id, email: user.email, role: user.role });

    // 4) sign token
    const payload = { user: { id: user.id, name: user.name, role: user.role } };
    console.log('[authRoutes][register] signing token with payload:', payload);
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) {
        console.error('[authRoutes][register] token sign error:', err);
        return res.status(500).send('Server error');
      }
      console.log('[authRoutes][register] token generated');
      res.json({ token });
    });
  } catch (err) {
    console.error('[authRoutes][register] Register error:', err);
    res.status(500).send('Server error');
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('[authRoutes][login] payload:', req.body);
  try {
    const { email, password } = req.body;

    // 1) find user
    const user = await User.findOne({ where: { email } });
    console.log('[authRoutes][login] found user:', user ? { id: user.id, email: user.email, role: user.role } : null);
    if (!user) {
      console.warn('[authRoutes][login] Invalid credentials - no user');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2) compare
    console.log('[auth][login] comparing', { provided: password, storedHash: user.password });
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[authRoutes][login] password match:', isMatch);
    if (!isMatch) {
      console.warn('[authRoutes][login] Invalid credentials - wrong password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3) sign
    const payload = { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    console.log('[authRoutes][login] signing token with payload:', payload);
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) {
        console.error('[authRoutes][login] token sign error:', err);
        return res.status(500).send('Server error');
      }
      console.log('[authRoutes][login] token generated');
      res.json({ token });
    });
  } catch (err) {
    console.error('[authRoutes][login] Login error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
