// @ts-nocheck
import React, { useState, useEffect } from 'react';

interface FortuneGarudaProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
  onClose: () => void;
}

const SYMBOLS = ['👑', '💎', '🟢', '🟨', 'K', 'Q', 'J', '10'];
const MULTIPLIERS = ['1x', '2x', '3x', '5x', '10x', '15x', '500x'];

export default function FortuneGarudaGame({
  balance,
  onUpdateBalance,
  onClose,
}: FortuneGarudaProps) {
  const [bet, setBet] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(['👑', '💎', '🟢']);
  const [activeMultiplier, setActiveMultiplier] = useState('1x');
  const [lastWin, setLastWin] = useState(0);

  const handleSpin = () => {
    if (balance < bet) {
      alert('পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }

    // ১. ওয়ালেট থেকে টাকা কাটা
    onUpdateBalance(-bet);
    setSpinning(true);
    setLastWin(0);

    // ২. স্পিন অ্যানিমেশন সিমুলেশন
    const spinInterval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      setActiveMultiplier(MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)]);
    }, 100);

    // ৩. ৩ সেকেন্ড পর রেজাল্ট সেট
    setTimeout(() => {
      clearInterval(spinInterval);
      setSpinning(false);

      const isWin = Math.random() < 0.35; // ৩৫% উইনিং চান্স
      if (isWin) {
        const symbol = SYMBOLS[Math.floor(Math.random() * 4)]; // হাই পেয়িং সিম্বল
        const mult = MULTIPLIERS[Math.floor(Math.random() * 4)];
        const multVal = parseInt(mult) || 1;

        setReels([symbol, symbol, symbol]);
        setActiveMultiplier(mult);

        const winAmount = bet * 5 * multVal;
        setLastWin(winAmount);
        onUpdateBalance(winAmount);
      }
    }, 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl relative flex flex-col min-h-[620px]">
      
      {/* Top Banner (Garuda Character Art Section) */}
      <div className="relative h-56 bg-gradient-to-b from-amber-900/60 via-slate-900 to-black flex flex-col items-center justify-center overflow-hidden border-b-2 border-amber-500/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent animate-pulse"></div>
        <span className="text-7xl animate-bounce drop-shadow-[0_10px_10px_rgba(234,179,8,0.5)] z-10">🦅</span>
        <h2 className="text-2xl font-black text-amber-400 tracking-wider font-serif z-10 mt-2 drop-shadow-md">
          FORTUNE GARUDA
        </h2>
        <span className="text-[10px] text-amber-200/80 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 z-10 mt-1">
          500X MULTIPLIER
        </span>
      </div>

      {/* Main Reels UI Frame */}
      <div className="p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-slate-950 to-black flex-1 flex flex-col justify-between">
        
        {/* Reels Grid (3 Main Reels + 1 Multiplier Reel) */}
        <div className="grid grid-cols-4 gap-2 bg-gradient-to-b from-amber-900/30 to-amber-950/80 p-3 rounded-xl border-2 border-amber-500/50 shadow-inner">
          {reels.map((symbol, idx) => (
            <div
              key={idx}
              className={`h-24 bg-slate-900/90 rounded-lg border border-amber-500/30 flex items-center justify-center text-4xl shadow-md ${
                spinning ? 'animate-pulse blur-[1px]' : ''
              }`}
            >
              {symbol}
            </div>
          ))}

          {/* Multiplier Side Reel */}
          <div className="h-24 bg-amber-500/10 rounded-lg border-2 border-amber-400 flex flex-col items-center justify-center text-amber-300 font-bold shadow-md">
            <span className="text-[10px] text-amber-400/70 uppercase">Mult</span>
            <span className="text-xl font-black text-amber-300 animate-pulse">
              {activeMultiplier}
            </span>
          </div>
        </div>

        {/* Win Status Display */}
        <div className="text-center my-2">
          <p className="text-xs text-amber-300/70 uppercase font-semibold">Total Win</p>
          <p className="text-2xl font-black text-amber-400 tracking-wider">
            ৳{lastWin.toFixed(2)}
          </p>
        </div>

        {/* Controls & Golden Spin Button */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between gap-3">
          {/* Bet Control */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Bet Amount</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-amber-500/30">
              <button
                onClick={() => setBet(Math.max(1, bet - 1))}
                className="w-6 h-6 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded font-bold text-xs"
              >
                -
              </button>
              <span className="text-xs font-bold text-amber-400 px-2">৳{bet}</span>
              <button
                onClick={() => setBet(bet + 5)}
                className="w-6 h-6 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* JILI Style Golden Spin Button */}
          <button
            disabled={spinning}
            onClick={handleSpin}
            className={`w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-1 shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition ${
              spinning ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
            }`}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-b from-amber-900 to-black flex items-center justify-center border-2 border-amber-300">
              <span className="text-amber-300 font-black text-xs tracking-widest uppercase">
                {spinning ? 'SPIN...' : 'JILI'}
              </span>
            </div>
          </button>
        </div>

        {/* Bottom Wallet Status */}
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-gray-400">
          <span>
            Balance: <strong className="text-amber-400">৳{balance}</strong>
          </span>
          <span className="text-emerald-400">● Real Wallet Active</span>
        </div>
      </div>
    </div>
  );
}