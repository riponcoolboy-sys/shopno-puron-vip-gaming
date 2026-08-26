import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { sounds } from '../../utils/audio';
import { calculateRTPWin } from '../../utils/rtpManager';
import { apiUrl } from '../../utils/security';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface BaccaratCard {
  val: number;
  suit: string;
  color: string;
}

interface BaccaratProps {
  currentBalance?: number;
  balance?: number;
  onBalanceChange?: (newBalance: number) => void;
  onUpdateBalance?: (newBalance: number, amount: number, type: 'BET' | 'WIN', description: string) => void;
  userId?: string;
  onClose?: () => void;
}

export default function Baccarat({
  currentBalance = 1000,
  balance,
  onBalanceChange,
  onUpdateBalance,
  userId,
  onClose,
}: BaccaratProps) {
  const activeBalance = typeof balance === 'number' ? balance : currentBalance;
  const [betAmount, setBetAmount] = useState<number>(1);
  const [selectedSide, setSelectedSide] = useState<'player' | 'banker' | 'tie'>('player'); // player, banker, tie
  const [playerCards, setPlayerCards] = useState<BaccaratCard[]>([]);
  const [bankerCards, setBankerCards] = useState<BaccaratCard[]>([]);
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  const [bankerScore, setBankerScore] = useState<number | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // র্যান্ডম কার্ড ও সুট জেনারেটর
  const suits = ['♠', '♥', '♦', '♣'];
  const getRandomCard = (): BaccaratCard => {
    const val = Math.floor(Math.random() * 9) + 1;
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const color = suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-slate-900';
    return { val, suit, color };
  };

  // ডাটাবেজে ব্যালেন্স সিঙ্ক এপিআই কল
  const syncBalanceToDatabase = async (newBal: number, amount: number = 0, type: 'BET' | 'WIN' = 'BET', desc: string = '') => {
    if (onBalanceChange) onBalanceChange(newBal); // ফ্রন্টএন্ড রিয়েলটাইম আপডেট
    if (onUpdateBalance && amount > 0) onUpdateBalance(newBal, amount, type, desc);

    // ক্লাউড ডাটাবেজে আপডেট সেভ
    if (userId) {
      try {
        await fetch(apiUrl('/api/user/update-balance'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, balance: newBal }),
        });
      } catch (err) {
        console.error('Database Sync Error:', err);
      }
    }
  };

  const handlePlay = () => {
    const curBal = Number(activeBalance) || 0;
    if (curBal <= 0) {
      alert('আপনার ব্যালেন্স ৳০.০০! বাজি ধরার জন্য অনুগ্রহ করে ডিপোজিট করুন।');
      return;
    }

    // কম ব্যালেন্স থাকলেও যাতে কোনো ব্লক ছাড়া বাজি ধরা যায় (অটো অ্যাডজাস্ট)
    const finalBet = getAffordableBet(curBal, betAmount);
    if (finalBet === null) {
      alert('সঠিক বাজি নির্বাচন করুন');
      return;
    }

    sounds.playClick();
    setIsPlaying(true);
    setResultMessage('');
    setPlayerCards([]);
    setBankerCards([]);
    setPlayerScore(null);
    setBankerScore(null);

    // ১. বাজি ধরার সাথে সাথে টাকা মাইনাস এবং ডাটাবেজে সেভ
    const balanceAfterBet = Math.max(0, curBal - finalBet);
    syncBalanceToDatabase(balanceAfterBet, finalBet, 'BET', `Baccarat বাজি: ৳${finalBet}`);

    // ২. ক্যাসিনো কার্ড ডিলিং অ্যানিমেশন
    setTimeout(() => {
      const p1 = getRandomCard();
      const p2 = getRandomCard();
      const b1 = getRandomCard();
      const b2 = getRandomCard();

      const pTotal = (p1.val + p2.val) % 10;
      const bTotal = (b1.val + b2.val) % 10;

      setPlayerCards([p1, p2]);
      setBankerCards([b1, b2]);
      setPlayerScore(pTotal);
      setBankerScore(bTotal);

      let winner: 'player' | 'banker' | 'tie' = 'tie';
      if (pTotal > bTotal) winner = 'player';
      else if (bTotal > pTotal) winner = 'banker';

      // ৩. উইনিং ক্যালকুলেশন ও ডাটাবেজে প্লাস (৩% RTP এনফোর্সড)
      let finalBal = balanceAfterBet;
      if (selectedSide === winner) {
        const mult = winner === 'tie' ? 3 : 2;
        const rawWin = Math.floor(finalBet * mult);
        const winAmt = calculateRTPWin(finalBet, rawWin);

        if (winAmt > 0) {
          finalBal = balanceAfterBet + winAmt;
          setResultMessage(`🎉 আপনি জিতেছেন! লাভ: ৳${winAmt}`);
          sounds.playWin();
          syncBalanceToDatabase(finalBal, winAmt, 'WIN', `Baccarat জয়: ৳${winAmt}`);
        } else {
          setResultMessage(`ক্যাসিনো হাউস রাউন্ড সমাপ্ত (${winner.toUpperCase()})।`);
        }
      } else {
        sounds.playCrash();
        setResultMessage(`❌ বিজয়ী: ${winner.toUpperCase()}! আপনি হেরেছেন।`);
        syncBalanceToDatabase(finalBal);
      }

      setIsPlaying(false);
    }, 1200);
  };

  return (
    <div className="max-w-md mx-auto my-4 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 p-5 rounded-3xl border-2 border-amber-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-white relative">
      {/* হেডার ও ওয়ালেট */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-amber-500/30 text-amber-400 transition"
              title="ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-black text-amber-400 tracking-wider">VIP BACCARAT</h2>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 inline" /> REAL TIME CASINO
            </span>
          </div>
        </div>
        <div className="bg-slate-900/90 px-4 py-1.5 rounded-full border border-amber-500/50 shadow-inner">
          <span className="text-xs text-slate-400 mr-1">ব্যালেন্স:</span>
          <strong className="text-amber-400 font-extrabold text-sm font-mono">
            ৳{activeBalance.toLocaleString()}
          </strong>
        </div>
      </div>

      {/* ক্যাসিনো টেবিল বোর্ডার ও কার্ড এরিয়া */}
      <div className="bg-gradient-to-b from-emerald-800 to-emerald-900 p-4 rounded-2xl border-4 border-amber-600/60 shadow-2xl relative mb-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_30%,_rgba(0,0,0,0.5)_100%)] pointer-events-none rounded-xl" />

        <div className="grid grid-cols-2 gap-3 relative z-10">
          {/* প্লেয়ার সাইড */}
          <div className="bg-black/30 p-3 rounded-xl border border-blue-500/30 text-center">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-black text-blue-400 tracking-wider">PLAYER</span>
              {playerScore !== null && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  পয়েন্ট: {playerScore}
                </span>
              )}
            </div>
            <div className="flex justify-center gap-2 h-16 items-center">
              {playerCards.length > 0 ? (
                playerCards.map((c, i) => (
                  <div
                    key={i}
                    className={`w-10 h-14 bg-white rounded-lg flex flex-col justify-between p-1 font-bold shadow-2xl animate-bounce ${c.color}`}
                  >
                    <span className="text-xs leading-none">{c.val}</span>
                    <span className="text-base text-center leading-none">{c.suit}</span>
                  </div>
                ))
              ) : (
                <div className="w-20 h-14 border-2 border-dashed border-blue-400/30 rounded-lg flex items-center justify-center text-xs text-blue-300/40 font-bold">
                  CARD
                </div>
              )}
            </div>
          </div>

          {/* ব্যাংকার সাইড */}
          <div className="bg-black/30 p-3 rounded-xl border border-red-500/30 text-center">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-black text-red-400 tracking-wider">BANKER</span>
              {bankerScore !== null && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  পয়েন্ট: {bankerScore}
                </span>
              )}
            </div>
            <div className="flex justify-center gap-2 h-16 items-center">
              {bankerCards.length > 0 ? (
                bankerCards.map((c, i) => (
                  <div
                    key={i}
                    className={`w-10 h-14 bg-white rounded-lg flex flex-col justify-between p-1 font-bold shadow-2xl animate-bounce ${c.color}`}
                  >
                    <span className="text-xs leading-none">{c.val}</span>
                    <span className="text-base text-center leading-none">{c.suit}</span>
                  </div>
                ))
              ) : (
                <div className="w-20 h-14 border-2 border-dashed border-red-400/30 rounded-lg flex items-center justify-center text-xs text-red-300/40 font-bold">
                  CARD
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* রেজাল্ট ব্যানার */}
      {resultMessage && (
        <div className="text-center font-bold text-amber-300 mb-4 bg-slate-900/90 py-2.5 px-3 rounded-xl border border-amber-500/40 text-xs shadow-lg animate-pulse">
          {resultMessage}
        </div>
      )}

      {/* বাজি সিলেকশন বাটন (Player, Tie, Banker) */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { id: 'player' as const, label: 'PLAYER', rate: '2x', color: 'border-blue-500 bg-blue-950/80 text-blue-300' },
          { id: 'tie' as const, label: 'TIE', rate: '8x', color: 'border-emerald-500 bg-emerald-950/80 text-emerald-300' },
          { id: 'banker' as const, label: 'BANKER', rate: '2x', color: 'border-red-500 bg-red-950/80 text-red-300' },
        ].map((item) => (
          <button
            key={item.id}
            disabled={isPlaying}
            onClick={() => {
              sounds.playClick();
              setSelectedSide(item.id);
            }}
            className={`py-2.5 px-1 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${item.color} ${
              selectedSide === item.id
                ? 'ring-2 ring-amber-400 scale-105 shadow-xl font-black'
                : 'opacity-60 hover:opacity-100 disabled:opacity-40'
            }`}
          >
            <span className="text-[11px] font-black">{item.label}</span>
            <span className="text-[9px] text-amber-400 font-bold">{item.rate}</span>
          </button>
        ))}
      </div>

      {/* চিপস দিয়ে বাজি সিলেক্ট: [1, 2, 5, 10, 20, 50] */}
      <div className="flex items-center justify-between mb-5 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 gap-1 overflow-x-auto">
        <span className="text-xs text-slate-400 pl-2 whitespace-nowrap">
          বাজি: <strong className="text-amber-400 font-mono">৳{betAmount}</strong>
        </span>
        <div className="flex gap-1 flex-1 justify-end">
          {BET_PRESETS.map((amt) => (
            <button
              key={amt}
              disabled={isPlaying}
              onClick={() => {
                sounds.playClick();
                setBetAmount(amt);
              }}
              className={`w-8 h-8 rounded-full font-black text-[10px] border-2 shadow-md flex items-center justify-center transition-all ${
                betAmount === amt
                  ? 'bg-amber-400 text-slate-950 border-white scale-110 shadow-amber-500/30'
                  : 'bg-slate-800 text-amber-400 border-amber-500/30 hover:bg-slate-700 disabled:opacity-40'
              }`}
            >
              ৳{amt}
            </button>
          ))}
        </div>
      </div>

      {/* কার্ড ডিল বাটন */}
      <button
        disabled={isPlaying}
        onClick={handlePlay}
        className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black py-3.5 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition text-xs uppercase tracking-widest disabled:opacity-50 active:scale-[0.99]"
      >
        {isPlaying ? 'কার্ড ডিল হচ্ছে...' : 'DEAL (খেলুন)'}
      </button>
    </div>
  );
}
