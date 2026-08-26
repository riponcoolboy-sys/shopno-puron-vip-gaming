const express = require('express');
const router = express.Router();
const User = require('../models/User'); // আপনার ইউজার মডেল

// ১. প্রতীকের পে-আউট এবং ওয়েট নির্ধারণ
const symbols = {
  'RED_GEM': { id: 1, payout3x: 30, weight: 5 },
  'BLUE_GEM': { id: 2, payout3x: 15, weight: 10 },
  'GREEN_GEM': { id: 3, payout3x: 8, weight: 20 },
  'A': { id: 4, payout3x: 5, weight: 30 },
  'K': { id: 5, payout3x: 3, weight: 40 },
  'WILD': { id: 6, payout3x: 50, weight: 2 }
};

// ২. ৪র্থ বোনাস চাকার মাল্টিপ্লায়ার
const bonusMultiplierReel = [
  { type: 'MULTIPLIER', value: 1, weight: 50 },
  { type: 'MULTIPLIER', value: 2, weight: 30 },
  { type: 'MULTIPLIER', value: 5, weight: 10 },
  { type: 'MULTIPLIER', value: 10, weight: 5 },
  { type: 'LUCKY_WHEEL', value: 'WHEEL', weight: 2 }
];

// ৩. র্যান্ডম আইটেম পিক করার ফাংশন
const getWeightedRandom = (items) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
};

// ৪. স্পিন এপিআই রাউট (৪৫% RTP সহ)
router.post('/api/game/fortune-gems/spin', async (req, res) => {
  try {
    const { userId, betAmount } = req.body;
    let user = null;

    if (User && typeof User.findById === 'function') {
      user = await User.findById(userId);
    }

    // ব্যালেন্স ডেবিট ও ভ্যালিডেশন
    const currentBal = user ? user.balance : 5000;
    if (currentBal < betAmount) {
      return res.status(400).json({ success: false, message: "পর্যাপ্ত ব্যালেন্স নেই" });
    }

    if (user) {
      await User.findByIdAndUpdate(userId, { $inc: { balance: -betAmount } });
    }

    // ৪৫% RTP লজিক
    let shouldWin = Math.random() < 0.45;
    let winAmount = 0;
    let finalReels = [];
    let fourthReelResult = getWeightedRandom(bonusMultiplierReel);

    const symbolNames = Object.keys(symbols);

    if (shouldWin) {
      // বিজয়ী কম্বিনেশন (৩টি একই প্রতীক)
      const winningSymbol = symbolNames[Math.floor(Math.random() * symbolNames.length)];
      finalReels = [winningSymbol, winningSymbol, winningSymbol];
      winAmount = betAmount * symbols[winningSymbol].payout3x;
    } else {
      // না জেতার কম্বিনেশন
      finalReels = [
        symbolNames[Math.floor(Math.random() * symbolNames.length)],
        symbolNames[Math.floor(Math.random() * symbolNames.length)],
        "GREEN_GEM"
      ];
    }

    // বোনাস চাকা দিয়ে গুন করা
    if (winAmount > 0) {
      if (fourthReelResult.type === 'MULTIPLIER') {
        winAmount *= fourthReelResult.value;
      } else if (fourthReelResult.type === 'LUCKY_WHEEL') {
        winAmount += (betAmount * 100); // বোনাস চাকা ১০০ গুণ
      }
      
      // জেতা টাকা প্লেয়ারের ওয়ালেটে যোগ করা
      if (user) {
        await User.findByIdAndUpdate(userId, { $inc: { balance: winAmount } });
      }
    }

    const updatedBalance = user ? (await User.findById(userId)).balance : (currentBal - betAmount + winAmount);

    res.status(200).json({
      success: true,
      reels: finalReels,
      fourthReel: fourthReelResult,
      winAmount: winAmount,
      currentBalance: updatedBalance
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
