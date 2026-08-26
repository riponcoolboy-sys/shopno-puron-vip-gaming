/**
 * ৪৫% RTP গ্লোবাল চেক
 * @param {number} betAmount - প্লেয়ারের বেট অ্যামাউন্ট
 * @param {number} rawWinAmount - এলগরিদম জেনারেট করা সম্ভাব্য উইন অ্যামাউন্ট
 * @returns {number} - চূড়ান্ত উইন অ্যামাউন্ট
 */
const calculateRTPWin = (betAmount, rawWinAmount) => {
  // ১. ৪৫% র্যান্ডম চান্স জেনারেট
  const isWinAllowed = Math.random() < 0.45;

  if (!isWinAllowed) {
    return 0; // হারবে (House 55% Profit Hold)
  }

  // ২. যদি জেতেও, তবে বেট অ্যামাউন্টের সর্বোচ্চ ৫ থেকে ১০ গুণের বেশি দেওয়া যাবে না (স্মল/মিডিয়াম উইন)
  const maxAllowedMultiplier = 10; 
  const maxWin = betAmount * maxAllowedMultiplier;

  // প্লেয়ার কোনোভাবেই ১০ টাকার বেটে ১০০০ টাকা পাবে না
  return Math.min(rawWinAmount, maxWin);
};

module.exports = { calculateRTPWin };
