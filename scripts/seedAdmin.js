// scripts/seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aviator_db';

async function seedAdmin() {
  try {
    console.log('ডাটাবেজ কানেক্ট করা হচ্ছে...');
    await mongoose.connect(MONGO_URI);
    console.log('ডাটাবেজ কানেক্টেড...');

    // ১. আপনার দেওয়া ইমেইল ও পাসওয়ার্ড
    const adminEmail = "riponcoolboy@gmail.com";
    const rawPassword = "Akashvai92@#*";

    // ২. ইমেইল ইতোমধ্যে ডাটাবেজে আছে কি না চেক করা
    const existingAdmin = await User.findOne({ 
      $or: [{ email: adminEmail }, { username: "admin_ripon" }] 
    });

    if (existingAdmin) {
      console.log('এই ইমেইল বা ইউজারনেম দিয়ে ইতোমধ্যে এডমিন অ্যাকাউন্ট তৈরি করা আছে!');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      return;
    }

    // ৩. পাসওয়ার্ড নিরাপদে এনক্রিপ্ট (Hash) করা
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // ৪. নতুন এডমিন ডাটাবেজে সেভ করা
    const newAdmin = new User({
      username: "admin_ripon",
      email: adminEmail,
      password: hashedPassword,
      role: "admin", // রোল এডমিন হওয়ায় ইউজারদের মতো সীমাবদ্ধতা থাকবে না
      balance: 0,
      vipTier: "DIAMOND",
      points: 9999
    });

    await newAdmin.save();
    console.log('✅ সফলভাবে এডমিন অ্যাকাউন্ট তৈরি হয়েছে!');
    console.log(`ইউজারনেম: admin_ripon`);
    console.log(`ইমেইল: ${adminEmail}`);

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('এডমিন তৈরিতে ত্রুটি হয়েছে:', error);
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
