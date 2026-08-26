// middleware/auth.js
const jwt = require('jwt-simple');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

const requireLogin = (req, res, next) => {
  let token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ success: false, message: "প্রথমে লগইন করুন!" });
  }

  // Handle both raw token and "Bearer <token>" format
  if (typeof token === 'string' && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.decode(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "সেশন মেয়াদোত্তীর্ণ হয়েছে, আবার লগইন করুন।" });
  }
};

module.exports = requireLogin;
