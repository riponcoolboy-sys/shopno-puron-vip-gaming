// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

interface PixiSlotGameProps {
  balance?: number;
  onUpdateBalance?: (amount: number) => void;
  onClose?: () => void;
}

const SYMBOLS = [
  { id: 'garuda', img: '/images/garuda.png', payout: 50 },
  { id: 'wild', img: '/images/wild.png', payout: 30 },
  { id: 'crown', img: '/images/crown.png', payout: 20 },
  { id: 'ring', img: '/images/ring.png', payout: 15 },
  { id: 'red-gem', img: '/images/red-gem.png', payout: 10 },
  { id: 'green-gem', img: '/images/green-gem.png', payout: 5 },
  { id: 'blue-gem', img: '/images/blue-gem.png', payout: 2 },
];

const MULTIPLIERS = [1, 2, 3, 5, 10];

export default function PixiSlotGame({ balance = 1000, onUpdateBalance, onClose }: PixiSlotGameProps) {
  const [currentBalance, setCurrentBalance] = useState(balance);
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [activeMultiplier, setActiveMultiplier] = useState(1);
  const [showCoins, setShowCoins] = useState(false);

  const isAutoSpinRef = useRef(isAutoSpin);
  isAutoSpinRef.current = isAutoSpin;

  const [grid, setGrid] = useState<string[]>(() => 
    Array(9).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].img)
  );

  const playSound = (soundName: string) => {
    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleSpin = () => {
    if (currentBalance < bet || isSpinning) {
      setIsAutoSpin(false);
      return;
    }

    playSound('click');
    playSound('spin');
    
    const newBal = currentBalance - bet;
    setCurrentBalance(newBal);
    if (onUpdateBalance) onUpdateBalance(-bet);

    setIsSpinning(true);
    setWinAmount(0);
    setShowCoins(false);

    let counter = 0;
    const interval = setInterval(() => {
      const randomGrid = Array(9).fill(0).map(() => 
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].img
      );
      const randomMult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];

      setGrid(randomGrid);
      setActiveMultiplier(randomMult);
      counter++;

      if (counter > 14) {
        clearInterval(interval);
        evaluateWin(randomGrid, randomMult, newBal);
        setIsSpinning(false);
      }
    }, 90);
  };

  const evaluateWin = (finalGrid: string[], multiplier: number, latestBal: number) => {
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

      const isWild1 = s1.includes('wild');
      const isWild2 = s2.includes('wild');
      const isWild3 = s3.includes('wild');

      const matchBase = [s1, s2, s3].find(s => !s.includes('wild')) || s1;

      if (
        (s1 === matchBase || isWild1) &&
        (s2 === matchBase || isWild2) &&
        (s3 === matchBase || isWild3)
      ) {
        const symbolObj = SYMBOLS.find(s => matchBase.includes(s.id));
        if (symbolObj) {
          baseWin += bet * symbolObj.payout;
        }
      }
    });

    if (baseWin > 0) {
      const totalWin = baseWin * multiplier;
      setWinAmount(totalWin);
      const updated = latestBal + totalWin;
      setCurrentBalance(updated);
      if (onUpdateBalance) onUpdateBalance(totalWin);
      
      setShowCoins(true);
      playSound('fire');
      playSound(totalWin >= bet * 15 ? 'big-win' : 'win');

      setTimeout(() => setShowCoins(false), 2800);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoSpin && !isSpinning) {
      timer = setTimeout(() => {
        if (isAutoSpinRef.current) handleSpin();
      }, 700);
    }
    return () => clearTimeout(timer);
  }, [isAutoSpin, isSpinning]);

  const handleClose = () => {
    playSound('click');
    setIsAutoSpin(false);
    if (onClose) onClose();
    else window.history.back();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-stone-950 border-4 border-amber-600 rounded-3xl p-3 text-white shadow-2xl relative overflow-hidden select-none font-sans">
      
      {/* 1. TOP BAR (BACK & WALLET) */}
      <div className="flex justify-between items-center mb-2 bg-stone-900/90 p-2 rounded-2xl border border-amber-500/40">
        <button 
          onClick={handleClose}
          className="px-3.5 py-1.5 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-xs rounded-xl border border-red-500 active:scale-95 transition-all shadow-md flex items-center gap-1"
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

      {/* 2. ANIMATED GARUDA MASCOT */}
      <div className="relative flex justify-center items-center h-44 overflow-hidden -my-1">
        <div className="absolute w-44 h-44 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <img 
          src="/images/garuda.gif" 
          alt="Animated Garuda" 
          className="w-48 h-48 object-contain z-10 mix-blend-screen drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]"
        />
      </div>

      {/* 3. GAME TITLE HEADER */}
      <div className="text-center bg-gradient-to-r from-amber-900/80 via-yellow-700/80 to-amber-900/80 py-1.5 rounded-t-xl border-t-2 border-x-2 border-amber-400 mb-0.5">
        <h2 className="text-amber-200 font-black text-xs tracking-widest uppercase drop-shadow">FORTUNE GARUDA 500</h2>
      </div>

      {/* 4. MAIN GAME BOARD (3x3 REELS + RIGHT MULTIPLIER COLUMN) */}
      <div className="flex gap-1.5 bg-stone-900 p-2 rounded-b-2xl border-2 border-amber-500/60 relative">
        
        {/* LEFT: 3x3 REEL GRID */}
        <div className="grid grid-cols-3 gap-1.5 flex-1">
          {grid.map((imgSrc, idx) => (
            <div 
              key={idx} 
              className="aspect-square bg-gradient-to-b from-stone-950 to-stone-900 border-2 border-amber-500/40 rounded-xl flex items-center justify-center p-2 shadow-inner overflow-hidden relative"
            >
              <img 
                src={imgSrc} 
                alt="symbol" 
                className={`w-full h-full object-contain mix-blend-screen transition-all ${isSpinning ? 'animate-pulse opacity-60 scale-95' : 'opacity-100 scale-100'}`}
              />
            </div>
          ))}
        </div>

        {/* RIGHT: MULTIPLIER REEL (2x, 3x, 1x, 5x, 10x) */}
        <div className="w-14 flex flex-col justify-between bg-stone-950 p-1 rounded-xl border border-amber-500/30">
          {MULTIPLIERS.map((m) => {
            const isActive = activeMultiplier === m;
            return (
              <div 
                key={m} 
                className={`py-1 rounded-lg text-center font-black text-xs border transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-yellow-200 scale-105 shadow-[0_0_10px_rgba(251,191,36,0.8)]' 
                    : 'bg-stone-900 text-amber-500/60 border-amber-500/20 opacity-70'
                }`}
              >
                {m}x
              </div>
            );
          })}
        </div>

        {/* WIN OVERLAY POPUP */}
        {showCoins && (
          <div className="absolute inset-0 z-20 pointer-events-none flex justify-center items-center bg-black/85 rounded-2xl">
            <div className="text-center bg-gradient-to-b from-yellow-400 via-amber-500 to-amber-700 p-4 rounded-2xl border-2 border-yellow-200 shadow-[0_0_30px_rgba(245,158,11,1)] animate-bounce">
              <p className="text-black font-black text-2xl tracking-wider drop-shadow">🔥 WIN x{activeMultiplier}! 🔥</p>
              <p className="text-white text-2xl font-black mt-1 drop-shadow">৳ {winAmount}</p>
            </div>
          </div>
        )}
      </div>

      {/* 5. BOTTOM WIN DISPLAY */}
      <div className="my-2 bg-stone-900/90 py-1.5 px-4 rounded-xl border border-amber-500/30 flex justify-between items-center">
        <span className="text-amber-400 font-extrabold text-xs tracking-wider">WIN</span>
        <span className="text-white font-black text-base">৳ {winAmount.toFixed(2)}</span>
      </div>

      {/* 6. BOTTOM CONTROL BAR */}
      <div className="flex items-center justify-between gap-2">
        
        {/* BET BUTTONS */}
        <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-amber-500/40">
          <button 
            onClick={() => { playSound('click'); setBet(prev => Math.max(10, prev - 10)); }}
            className="w-7 h-7 bg-stone-800 border border-amber-500/40 rounded-lg font-black text-sm text-amber-400 active:scale-90"
          >
            -
          </button>
          <div className="px-2 text-center">
            <p className="text-[8px] uppercase text-gray-400 font-bold">BET</p>
            <p className="font-extrabold text-xs text-amber-300">৳{bet}</p>
          </div>
          <button 
            onClick={() => { playSound('click'); setBet(prev => prev + 10); }}
            className="w-7 h-7 bg-stone-800 border border-amber-500/40 rounded-lg font-black text-sm text-amber-400 active:scale-90"
          >
            +
          </button>
        </div>

        {/* SPIN BUTTON */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || currentBalance < bet || isAutoSpin}
          className={`flex-1 py-3 rounded-2xl font-black text-lg tracking-widest shadow-xl border-2 transition-all ${
            isSpinning || currentBalance < bet
              ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black border-yellow-200 hover:brightness-110 active:scale-95 shadow-amber-500/30'
          }`}
        >
          {isSpinning ? 'SPIN...' : 'SPIN'}
        </button>

        {/* AUTO SPIN */}
        <button
          onClick={() => {
            playSound('click');
            setIsAutoSpin(!isAutoSpin);
          }}
          className={`px-3 py-3 rounded-2xl font-extrabold text-xs border transition-all ${
            isAutoSpin 
              ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-600/40' 
              : 'bg-stone-900 text-amber-400 border-amber-500/40 hover:bg-stone-800'
          }`}
        >
          {isAutoSpin ? 'STOP' : 'AUTO'}
        </button>

      </div>

    </div>
  );
}