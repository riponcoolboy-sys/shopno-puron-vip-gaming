// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

interface PixiSlotGameProps {
  balance?: number;
  onUpdateBalance?: (amount: number) => void;
  onClose?: () => void;
}

// Fallback visual representations to prevent image crashes
const EMOJI_SYMBOLS = [
  { id: 'garuda', label: '🦅', payout: 50, color: 'text-yellow-400' },
  { id: 'wild', label: '👑', payout: 30, color: 'text-amber-300' },
  { id: 'crown', label: '💎', payout: 20, color: 'text-blue-400' },
  { id: 'ring', label: '💍', payout: 15, color: 'text-purple-400' },
  { id: 'red-gem', label: '🔻', payout: 10, color: 'text-red-500' },
  { id: 'green-gem', label: '🟢', payout: 5, color: 'text-green-400' },
  { id: 'blue-gem', label: '🔷', payout: 2, color: 'text-cyan-400' },
];

const MULTIPLIERS = [1, 2, 3, 5, 10];

export default function PixiSlotGame({ balance, onUpdateBalance, onClose }: PixiSlotGameProps) {
  // Safe Balance Syncing with Profile
  const getProfileBalance = () => {
    try {
      const w1 = localStorage.getItem('shopno_puron_wallet');
      if (w1) {
        const p = JSON.parse(w1);
        if (typeof p.balance === 'number' && !isNaN(p.balance)) return p.balance;
      }
      const w2 = localStorage.getItem('user_balance');
      if (w2 && !isNaN(parseFloat(w2))) return parseFloat(w2);
    } catch (e) {}
    return typeof balance === 'number' ? balance : 5000;
  };

  const [currentBalance, setCurrentBalance] = useState<number>(getProfileBalance);
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [activeMultiplier, setActiveMultiplier] = useState(1);
  const [showCoins, setShowCoins] = useState(false);

  const isAutoSpinRef = useRef(isAutoSpin);
  isAutoSpinRef.current = isAutoSpin;

  const [grid, setGrid] = useState<typeof EMOJI_SYMBOLS>(() => 
    Array(9).fill(0).map(() => EMOJI_SYMBOLS[Math.floor(Math.random() * EMOJI_SYMBOLS.length)])
  );

  // Sync state if balance changes outside
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentBalance(getProfileBalance());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateWallet = (delta: number) => {
    setCurrentBalance((prev) => {
      const nextBal = Math.max(0, prev + delta);
      try {
        const w1 = localStorage.getItem('shopno_puron_wallet');
        let walletObj = w1 ? JSON.parse(w1) : {};
        walletObj.balance = nextBal;
        localStorage.setItem('shopno_puron_wallet', JSON.stringify(walletObj));
        localStorage.setItem('user_balance', nextBal.toString());
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}

      if (onUpdateBalance) onUpdateBalance(delta);
      return nextBal;
    });
  };

  const handleSpin = () => {
    if (currentBalance < bet || isSpinning) {
      setIsAutoSpin(false);
      return;
    }

    const newBal = currentBalance - bet;
    updateWallet(-bet);

    setIsSpinning(true);
    setWinAmount(0);
    setShowCoins(false);

    let counter = 0;
    const interval = setInterval(() => {
      const randomGrid = Array(9).fill(0).map(() => 
        EMOJI_SYMBOLS[Math.floor(Math.random() * EMOJI_SYMBOLS.length)]
      );
      const randomMult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];

      setGrid(randomGrid);
      setActiveMultiplier(randomMult);
      counter++;

      if (counter > 12) {
        clearInterval(interval);
        evaluateWin(randomGrid, randomMult);
        setIsSpinning(false);
      }
    }, 100);
  };

  const evaluateWin = (finalGrid: typeof EMOJI_SYMBOLS, multiplier: number) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8], 
      [0, 4, 8], [2, 4, 6]             
    ];

    let baseWin = 0;

    lines.forEach(line => {
      const s1 = finalGrid[line[0]];
      const s2 = finalGrid[line[1]];
      const s3 = finalGrid[line[2]];

      const isWild1 = s1.id === 'wild';
      const isWild2 = s2.id === 'wild';
      const isWild3 = s3.id === 'wild';

      const matchBase = [s1, s2, s3].find(s => s.id !== 'wild') || s1;

      if (
        (s1.id === matchBase.id || isWild1) &&
        (s2.id === matchBase.id || isWild2) &&
        (s3.id === matchBase.id || isWild3)
      ) {
        baseWin += bet * matchBase.payout;
      }
    });

    if (baseWin > 0) {
      const totalWin = baseWin * multiplier;
      setWinAmount(totalWin);
      updateWallet(totalWin);
      setShowCoins(true);
      setTimeout(() => setShowCoins(false), 2500);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isAutoSpin && !isSpinning) {
      timer = setTimeout(() => {
        if (isAutoSpinRef.current) handleSpin();
      }, 600);
    }
    return () => clearTimeout(timer);
  }, [isAutoSpin, isSpinning]);

  const handleClose = () => {
    setIsAutoSpin(false);
    if (onClose) onClose();
    else window.history.back();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-stone-950 border-4 border-amber-600 rounded-3xl p-3 text-white shadow-2xl relative overflow-hidden select-none font-sans">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-2 bg-stone-900/90 p-2 rounded-2xl border border-amber-500/40">
        <button 
          onClick={handleClose}
          className="px-3 py-1.5 bg-gradient-to-r from-red-700 to-red-900 text-white font-black text-xs rounded-xl border border-red-500 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>←</span> Back
        </button>

        <div className="flex items-center gap-2 bg-black/70 px-3 py-1 rounded-xl border border-amber-500/40">
          <span className="text-base">💰</span>
          <div>
            <p className="text-[9px] uppercase font-bold text-amber-400 leading-none">Wallet</p>
            <p className="text-sm font-black text-amber-300 leading-tight">৳ {currentBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative flex justify-center items-center h-32 bg-stone-900/60 rounded-2xl mb-2 border border-amber-500/30">
        <div className="text-center">
          <span className="text-6xl drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">🦅</span>
          <p className="text-amber-400 font-black text-xs tracking-widest mt-1">GARUDA SLOT VIP</p>
        </div>
      </div>

      {/* Reels Grid & Multipliers */}
      <div className="flex gap-1.5 bg-stone-900 p-2 rounded-2xl border-2 border-amber-500/60 relative">
        <div className="grid grid-cols-3 gap-1.5 flex-1">
          {grid.map((item, idx) => (
            <div 
              key={idx} 
              className="aspect-square bg-stone-950 border-2 border-amber-500/40 rounded-xl flex items-center justify-center p-2 shadow-inner relative overflow-hidden"
            >
              <span className={`text-3xl transition-transform ${isSpinning ? 'scale-90 opacity-60 animate-bounce' : 'scale-100 opacity-100'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Multipliers Bar */}
        <div className="w-12 flex flex-col justify-between bg-stone-950 p-1 rounded-xl border border-amber-500/30">
          {MULTIPLIERS.map((m) => {
            const isActive = activeMultiplier === m;
            return (
              <div 
                key={m} 
                className={`py-1 rounded-lg text-center font-black text-[11px] border transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-yellow-200 shadow-[0_0_10px_rgba(251,191,36,0.8)]' 
                    : 'bg-stone-900 text-amber-500/60 border-amber-500/20'
                }`}
              >
                {m}x
              </div>
            );
          })}
        </div>

        {/* Win Banner */}
        {showCoins && (
          <div className="absolute inset-0 z-20 flex justify-center items-center bg-black/80 rounded-2xl">
            <div className="text-center bg-gradient-to-b from-yellow-400 to-amber-600 p-4 rounded-2xl border-2 border-yellow-200 shadow-2xl animate-bounce">
              <p className="text-black font-black text-xl">🔥 WIN x{activeMultiplier}! 🔥</p>
              <p className="text-white text-2xl font-black mt-1">৳ {winAmount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Win Info */}
      <div className="my-2 bg-stone-900/90 py-1.5 px-4 rounded-xl border border-amber-500/30 flex justify-between items-center">
        <span className="text-amber-400 font-extrabold text-xs">WIN</span>
        <span className="text-white font-black text-base">৳ {winAmount.toFixed(2)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-amber-500/40">
          <button 
            onClick={() => setBet(prev => Math.max(10, prev - 10))}
            className="w-7 h-7 bg-stone-800 rounded-lg font-black text-sm text-amber-400"
          >
            -
          </button>
          <div className="px-2 text-center">
            <p className="text-[8px] uppercase text-gray-400 font-bold">BET</p>
            <p className="font-extrabold text-xs text-amber-300">৳{bet}</p>
          </div>
          <button 
            onClick={() => setBet(prev => prev + 10)}
            className="w-7 h-7 bg-stone-800 rounded-lg font-black text-sm text-amber-400"
          >
            +
          </button>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning || currentBalance < bet || isAutoSpin}
          className={`flex-1 py-3 rounded-2xl font-black text-lg tracking-widest border-2 transition-all ${
            isSpinning || currentBalance < bet
              ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black border-yellow-200 active:scale-95'
          }`}
        >
          {isSpinning ? 'SPIN...' : 'SPIN'}
        </button>

        <button
          onClick={() => setIsAutoSpin(!isAutoSpin)}
          className={`px-3 py-3 rounded-2xl font-extrabold text-xs border transition-all ${
            isAutoSpin 
              ? 'bg-red-600 text-white border-red-400 animate-pulse' 
              : 'bg-stone-900 text-amber-400 border-amber-500/40'
          }`}
        >
          {isAutoSpin ? 'STOP' : 'AUTO'}
        </button>
      </div>

    </div>
  );
}