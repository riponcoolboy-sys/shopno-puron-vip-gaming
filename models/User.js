// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['player', 'admin'],
      default: 'player',
    },
    balance: {
      type: Number,
      default: 0,
    },
    vipTier: {
      type: String,
      default: 'VIP 1',
    },
    points: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
