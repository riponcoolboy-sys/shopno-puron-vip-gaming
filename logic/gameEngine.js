// logic/gameEngine.js

// সেশন ট্র্যাকিং (টানা জেতা ব্লক করার জন্য)
let lastUserWinRoundMap = {};

/**
 * সেন্ট্রাল গেম অ্যালগরিদম - কঠোর ৩% উইন রেট এবং হার্ড ক্যাপিং সহ
 * @param {number|string} userId - ইউজারের আইডি
 * @param {number} betAmount - প্লেয়ারের বেট অ্যামাউন্ট
 * @param {object} userStats - ডাটাবেজ থেকে পাওয়া ইউজারের স্ট্যাটাস (deposit, balance, totalWon)
 * @returns {object} - গেমের রিজাল্ট (isWin, multiplier, winAmount, statusMessage)
 */
const calculateGameResult = (userId = 'guest', betAmount = 20, userStats = {}) => {
    // ১. গ্লোবাল সেটিংস (৯৭% হাউস মার্জিন ও ৩% উইন রেট)
    const TARGET_WIN_RATE = 0.03; // কঠোর ৩% জেতার সম্ভাবনা
    const MAX_MULTIPLIER_CAP = 3.0; // সর্বোচ্চ ৩ গুণ পর্যন্ত জিততে পারবে (২০ টাকার বেটে সর্বোচ্চ ৬০ টাকা)
    const PROFIT_TARGET_RATIO = 1.20; // ডিপোজিটের ১২০% (২০% লাভ) হলেই ব্লক
    const DRAIN_BALANCE_LIMIT = 0.2; // ২০% এর নিচে নামলে ড্রেইন ফেজ

    const totalDeposit = userStats?.deposit || 0;
    const currentBalance = userStats?.balance || 0;
    const uKey = String(userId);
    
    // রিজাল্ট অবজেক্ট
    let result = {
        isWin: false,
        multiplier: 0,
        winAmount: 0,
        statusMessage: "Loss"
    };

    // ২. টানা উইনিং স্ট্রাইক ব্লক (Consecutive Win Breaker)
    const lastWinTime = lastUserWinRoundMap[uKey] || 0;
    const now = Date.now();
    if (now - lastWinTime < 45000) {
        result.statusMessage = "Streak Protection (Forced Loss)";
        return result;
    }

    // ৩. হার্ড ব্লক লজিক (PROFIT_TARGET_RATIO)
    // ইউজার যদি ২০% বা তার বেশি লাভে থাকে, তাকে আর জিততে দেওয়া হবে না
    if (totalDeposit > 0 && currentBalance >= totalDeposit * PROFIT_TARGET_RATIO) {
        result.statusMessage = "Profit Target Reached (Forced Loss)";
        return result; 
    }

    // ৪. ডায়নামিক রেট কন্ট্রোল (সর্বোচ্চ ৩% এ সীমাবদ্ধ)
    let currentWinRate = TARGET_WIN_RATE;
    if (currentBalance <= totalDeposit * DRAIN_BALANCE_LIMIT && totalDeposit > 0) {
        currentWinRate = 0.01; // ১% রেট (Drain Phase)
    }

    // ৫. র্যান্ডম রেজাল্ট জেনারেশন (RNG)
    const randomNumber = Math.random();

    // কঠোর ৩% লজিক চেক
    if (randomNumber <= currentWinRate) {
        // ৬. ইউজার জিতেছে: মাল্টিপ্লায়ার সর্বোচ্চ ৩ গুণ (২০ টাকার বেটে কোনোভাবেই ২০০+ টাকা হবে না)
        result.isWin = true;
        result.statusMessage = "Win";

        // ১.১০x থেকে সর্বোচ্চ ৩.০০x এর মধ্যে মাল্টিপ্লায়ার
        let mult = 1.10 + Math.random() * 1.50; // ১.১০x - ২.৬০x সাধারণত
        if (Math.random() < 0.10) {
            mult = Math.min(3.00, 2.60 + Math.random() * 0.40);
        }
        
        mult = Math.min(MAX_MULTIPLIER_CAP, parseFloat(mult.toFixed(2)));
        result.multiplier = mult;
        
        // হার্ড ক্যাপিং: কোনো অবস্থাতেই ২০ টাকার বেটে ৬০ টাকার বেশি যাবে না (betAmount * 3)
        const rawWin = Math.floor(betAmount * result.multiplier);
        const hardCap = Math.floor(betAmount * MAX_MULTIPLIER_CAP);
        result.winAmount = Math.min(rawWin, hardCap);

        lastUserWinRoundMap[uKey] = now;
    } else {
        // ৭. ইউজার হেরেছে (৯৭% ক্ষেত্রে)
        result.isWin = false;
        result.statusMessage = "Loss";
        result.multiplier = 0;
        result.winAmount = 0;
    }

    return result;
};

module.exports = { calculateGameResult };

