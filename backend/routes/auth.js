const express = require('express');
const jwt = require('jsonwebtoken');
const { SECRET } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ message: 'رمز مدیریت روی سرور تنظیم نشده است' });
  }
  if (!password || password !== adminPassword) {
    return res.status(401).json({ message: 'رمز عبور اشتباه است' });
  }

  const token = jwt.sign({ admin: true }, SECRET, { expiresIn: '12h' });
  res.json({ token });
});

module.exports = router;
