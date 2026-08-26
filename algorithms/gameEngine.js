// algorithms/gameEngine.js
const { calculateGameResult } = require('../logic/gameEngine');

// ৩% প্লেয়ার রিফান্ড (RTP), ৯৭% নিশ্চিত হাউস মার্জিন ও অপারেটর প্রফিট
const TARGET_RTP = 0.03; 

function calculateCrashPoint(totalBetsInRound = 0) {
  const rand = Math.random();

  // ১. ইনস্ট্যান্ট ক্র্যাশ (৪০% রাউন্ডে শুরুতেই ১.০০x - ১.০২x এ প্লেন ভেঙে যাবে)
  if (rand < 0.40) {
    return rand < 0.25 ? 1.00 : 1.02; 
  }

  // ২. হাই-বেট রিস্ক কন্ট্রোল (১,০০০ টাকার বেশি বেট হলে দ্রুত ক্র্যাশ করবে)
  if (totalBetsInRound > 1000) { 
    // ১.০২x থেকে ১.১৫x এর মধ্যেই অ্যালগরিদম ক্র্যাশ করাবে
    return parseFloat((1.02 + Math.random() * 0.12).toFixed(2));
  }

  // ৩. ৩% RTP ভিত্তিক কঠোর অ্যালগরিদম হিসাব
  let crashPoint = (1 / (1 - rand * TARGET_RTP));

  // ৪. ম্যাক্সিমাম মাল্টিপ্লায়ার হার্ড ক্যাপ (কোনোভাবেই ৩.০০x এর উপরে যেতে দেবে না)
  if (crashPoint > 3.00) {
    crashPoint = 3.00;
  } else if (crashPoint > 2.00 && Math.random() > 0.10) {
    crashPoint = parseFloat((1.08 + Math.random() * 0.40).toFixed(2));
  }

  crashPoint = Math.min(3.00, Math.max(1.00, parseFloat(crashPoint.toFixed(2))));

  return crashPoint;
}

module.exports = { calculateCrashPoint, calculateGameResult };


