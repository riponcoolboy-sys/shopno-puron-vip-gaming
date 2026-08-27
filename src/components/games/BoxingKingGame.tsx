// @ts-nocheck
import React, { useState } from 'react';

interface BoxingKingProps {
  balance?: number;
  onUpdateBalance: (amount: number) => void;
  onClose: () => void;
}

const BOXING_SYMBOLS = ['🥊', '🩳', '👑', '⚡', 'WILD', 'K', 'Q'];

export default function BoxingKingGame({
  balance = 1000,
  onUpdateBalance,
  onClose,
}: BoxingKingProps) {
  const [bet, setBet] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(['🥊', 'WILD', '⚡']);
  const [lastWin, setLastWin] = useState(0);

  const handleSpin = () => {
    if (balance < bet) {
      alert('পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }

    if (onUpdateBalance) onUpdateBalance(-bet);
    setSpinning(true);
    setLastWin(0);

    const spinInterval = setInterval(() => {
      setReels([
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
      ]);
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);
      setSpinning(false);

      const isWin = Math.random() < 0.30;
      if (isWin) {
        setReels(['🥊', '🥊', 'WILD']);
        const winAmount = bet * 8;
        setLastWin(winAmount);
        if (onUpdateBalance) onUpdateBalance(winAmount);
      }
    }, 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-red-500/40 shadow-2xl relative flex flex-col min-h-[600px]">
      <div className="flex justify-between items-center bg-slate-900 px-4 py-3 border-b border-red-500/30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥊</span>
          <h2 className="text-red-400 font-bold text-base tracking-wide">BOXING KING</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-slate-800 px-2 py-1 rounded text-xs"
          >
            ✕ বন্ধ করুন
          </button>
        )}
      </div>

      <div className="relative h-48 bg-gradient-to-b from-red-950/80 via-slate-900 to-black flex flex-col items-center justify-center overflow-hidden border-b-2 border-red-500/40">
        <span className="text-7xl animate-pulse">🥊</span>
        <span className="text-xs text-red-200 font-bold uppercase tracking-widest mt-2">
          FREE COMBOS ACTIVE
        </span>
      </div>

      <div className="p-4 bg-slate-950 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-3 gap-3 bg-red-950/20 p-4 rounded-xl border border-red-500/30">
          {reels.map((symbol, idx) => (
            <div
              key={idx}
              className={`h-24 bg-slate-900 rounded-lg border border-red-500/40 flex items-center justify-center text-4xl shadow-inner ${
                spinning ? 'animate-bounce' : ''
              }`}
            >
              {symbol}
            </div>
          ))}
        </div>

        <div className="text-center my-3">
          <p className="text-[10px] text-gray-400 uppercase">Total Win</p>
          <p className="text-2xl font-black text-red-400">৳{lastWin.toFixed(2)}</p>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Bet:</span>
            <button
              onClick={() => setBet(Math.max(1, bet - 1))}
              className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs font-bold"
            >
              -
            </button>
            <span className="text-sm font-bold text-red-400">৳{bet}</span>
            <button
              onClick={() => setBet(bet + 5)}
              className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs font-bold"
            >
              +
            </button>
          </div>

          <button
            disabled={spinning}
            onClick={handleSpin}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black rounded-xl shadow-lg active:scale-95"
          >
            {spinning ? 'PUNCHING...' : 'FIGHT'}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-gray-400">
          <span>
            Balance: <strong className="text-red-400">৳{balance}</strong>
          </span>
          <span className="text-emerald-400">● Real Wallet</span>
        </div>
      </div>
    </div>
  );
}