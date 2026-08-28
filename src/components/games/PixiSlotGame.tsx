// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

interface PixiSlotGameProps {
  balance?: number;
  onUpdateBalance?: (amount: number) => void;
  onClose?: () => void;
}

const SYMBOLS = [
  { id: 'garuda', label: '🦅', payout: 50 },
  { id: 'wild', label: '👑', payout: 30 },
  { id: 'crown', label: '💎', payout: 20 },
  { id: 'ring', label: '💍', payout: 15 },
  { id: 'red-gem', label: '🔻', payout: 10 },
  { id: 'green-gem', label: '🟢', payout: 5 },
  { id: 'blue-gem', label: '🔷', payout: 2 },
];

const MULTIPLIERS = [1, 2, 3, 5, 10];

export default function PixiSlotGame({ balance = 5000, onUpdateBalance, onClose }: PixiSlotGameProps) {
  // Safe Balance Reader
  const getInitialBalance = () => {
    try {
      const stored = localStorage.getItem('user_balance');
      if (stored && !isNaN(parseFloat(stored)) && parseFloat(stored) > 0) {
        return parseFloat(stored);
      }
      const w1 = localStorage.getItem('shopno_puron_wallet');
      if (w1) {
        const p = JSON.parse(w1);
        if (typeof p.balance === 'number' && p.balance > 0) return p.balance;
      }
    } catch (e) {}
    return balance > 0 ? balance : 5000;
  };

  const [currentBalance, setCurrentBalance] = useState<number>(getInitialBalance);
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [activeMultiplier, setActiveMultiplier] = useState(1);
  const [showCoins, setShowCoins] = useState(false);

  const isAutoSpinRef = useRef(isAutoSpin);
  isAutoSpinRef.current = isAutoSpin;

  const [grid, setGrid] = useState<typeof SYMBOLS>(() => 
    Array(9).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  );

  const updateWallet = (delta: number) => {
    setCurrentBalance((prev) => {
      const nextBal = Math.max(0, prev + delta);
      try {
        localStorage.setItem('user_balance', nextBal.toString());
        const w1 = localStorage.getItem('shopno_puron_wallet');
        let walletObj = w1 ? JSON.parse(w1) : {};
        walletObj.balance = nextBal;
        localStorage.setItem('shopno_puron_wallet', JSON.stringify(walletObj));
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

    updateWallet(-bet);
    setIsSpinning(true);
    setWinAmount(0);
    setShowCoins(false);

    let counter = 0;
    const interval = setInterval(() => {
      const randomGrid = Array(9).fill(0).map(() => 
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      );
      const randomMult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];

      setGrid(randomGrid);
      setActiveMultiplier(randomMult);
      counter++;

      if (counter > 10) {
        clearInterval(interval);
        evaluateWin(randomGrid, randomMult);
        setIsSpinning(false);
      }
    }, 100);
  };

  const evaluateWin = (finalGrid: typeof SYMBOLS, multiplier: number) => {
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
      setTimeout(() => setShowCoins(false), 2000);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isAutoSpin && !isSpinning) {
      timer = setTimeout(() => {
        if (isAutoSpinRef.current) handleSpin();
      }, 500);
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
          className="px-3.5 py-1.5 bg-gradient-to-r from-red-700 to-red-900 text-white font-extrabold text-xs rounded-xl border border-red-500 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>←</span> Back
        </button>

        <div className="flex items-center gap-2 bg-black/70 px-3.5 py-1 rounded-xl border border-amber-500/40">
          <span className="text-base">💰</span>
          <div>
            <p className="text-[9px] uppercase font-bold text-amber-400 leading-none">Wallet</p>
            <p className="text-sm font-black text-amber-300 leading-tight">৳ {currentBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative flex justify-center items-center h-28 bg-stone-900/60 rounded-2xl mb-2 border border-amber-500/30">
        <div className="text-center">
          <span className="text-5xl drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">🦅</span>
          <p className="text-amber-400 font-black text-xs tracking-widest mt-1">GARUDA SLOT VIP</p>
        </div>
      </div>

      {/* Grid */}
      <div className="flex gap-1.5 bg-stone-900 p-2 rounded-2xl border-2 border-amber-500/60 relative">
        <div className="grid grid-cols-3 gap-1.5 flex-1">
          {grid.map((item, idx) => (
            <div 
              key={idx} 
              className="aspect-square bg-stone-950 border-2 border-amber-500/40 rounded-xl flex items-center justify-center p-2 shadow-inner"
            >
              <span className={`text-3xl transition-all ${isSpinning ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Multipliers */}
        <div className="w-12 flex flex-col justify-between bg-stone-950 p-1 rounded-xl border border-amber-500/30">
          {MULTIPLIERS.map((m) => {
            const isActive = activeMultiplier === m;
            return (
              <div 
                key={m} 
                className={`py-1 rounded-lg text-center font-black text-[11px] border ${
                  isActive 
                    ? 'bg-amber-400 text-black border-yellow-200' 
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
            <div className="text-center bg-amber-500 p-4 rounded-2xl border-2 border-yellow-200 text-black font-black">
              <p className="text-xl">🔥 WIN x{activeMultiplier}! 🔥</p>
              <p className="text-2xl text-white mt-1">৳ {winAmount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Win Display */}
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
          disabled={isSpinning || currentBalance < bet}
          className={`flex-1 py-3 rounded-2xl font-black text-lg border-2 ${
            isSpinning || currentBalance < bet
              ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-200 active:scale-95'
          }`}
        >
          {isSpinning ? 'SPIN...' : 'SPIN'}
        </button>

        <button
          onClick={() => setIsAutoSpin(!isAutoSpin)}
          className={`px-3 py-3 rounded-2xl font-extrabold text-xs border ${
            isAutoSpin 
              ? 'bg-red-600 text-white border-red-400' 
              : 'bg-stone-900 text-amber-400 border-amber-500/40'
          }`}
        >
          {isAutoSpin ? 'STOP' : 'AUTO'}
        </button>
      </div>

    </div>
  );
}