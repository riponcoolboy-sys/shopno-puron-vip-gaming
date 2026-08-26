// routes/admin.js
const express = require('express');
const router = express.Router();
const jwt = require('jwt-simple');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_123';

// এডমিন লগইন এপিআই
router.post('/api/admin/login', async (req, res) => {
  const { email, username, password } = req.body;
  const targetEmail = (email || username || '').trim();

  // ১. আপনার নির্ধারিত ইমেইল চেক
  if (targetEmail !== "riponcoolboy@gmail.com" && targetEmail !== "admin_ripon") {
    return res.status(401).json({ success: false, message: "অনুমোদিত এডমিন ইমেইল নয়!" });
  }

  // ২. আপনার নির্ধারিত স্ট্রং পাসওয়ার্ড চেক
  if (password !== "Akashvai92@#*") {
    return res.status(401).json({ success: false, message: "ভুল এডমিন পাসওয়ার্ড!" });
  }

  // ৩. সিকিউর টোকেন জেনারেট
  const token = jwt.encode({ email: "riponcoolboy@gmail.com", role: 'admin', username: 'admin_ripon' }, JWT_SECRET);
  res.status(200).json({ 
    success: true, 
    message: "এডমিন লগইন সফল!", 
    token,
    user: {
      _id: 'usr_admin_ripon',
      username: 'admin_ripon',
      email: 'riponcoolboy@gmail.com',
      role: 'admin',
      balance: 0,
      vipTier: 'DIAMOND',
      points: 9999
    }
  });
});

module.exports = router;
