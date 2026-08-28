// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

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

export default function PixiSlotGame(props: any) {
  const handleClose = () => {
    playSound('click');
    setIsAutoSpin(false);
    if (typeof props.onClose === 'function') props.onClose();
    else if (typeof props.onBack === 'function') props.onBack();
    else window.history.back();
  };

  // 🔥 Smart Balance Detection: Props + Global User + LocalStorage
  const [currentBalance, setCurrentBalance] = useState<number>(() => {
    // 1. Check Props first
    if (typeof props.balance === 'number') return props.balance;
    if (props.user && typeof props.user.balance === 'number') return props.user.balance;
    
    // 2. Check Global User Object in LocalStorage
    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      if (typeof userObj.balance === 'number') return userObj.balance;
    } catch(e) {}
    
    // 3. Fallback to simple balance key
    const savedBal = localStorage.getItem('user_balance');
    return savedBal ? parseFloat(savedBal) : 0; // If everything fails, return 0
  });

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

  useEffect(() => {
    if (typeof props.balance === 'number') {
      setCurrentBalance(props.balance);
    } else if (props.user && typeof props.user.balance === 'number') {
      setCurrentBalance(props.user.balance);
    }
  }, [props.balance, props.user]);

  // 🔥 Sync Wallet with Main App
  const updateWallet = (delta: number) => {
    setCurrentBalance((prev) => {
      const nextBal = Math.max(0, prev + delta);
      
      localStorage.setItem('user_balance', nextBal.toString());
      
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userObj.balance = nextBal;
          localStorage.setItem('user', JSON.stringify(userObj));
          // Trigger storage event so the top header updates instantly
          window.dispatchEvent(new Event('storage'));
        }
      } catch(e) {}

      if (typeof props.onUpdateBalance === 'function') props.onUpdateBalance(delta);
      if (typeof props.updateBalance === 'function') props.updateBalance(delta);
      return nextBal;
    });
  };

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
    
    updateWallet(-bet);

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

      if (counter > 12) {
        clearInterval(interval);
        evaluateWin(randomGrid, randomMult);
        setIsSpinning(false);
      }
    }, 90);
  };

  const evaluateWin = (finalGrid: string[], multiplier: number) => {
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
      
      updateWallet(totalWin);
      
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

  return (
    <div className="w-full max-w-md mx-auto bg-stone-950 border-4 border-amber-600 rounded-3xl p-3 text-white shadow-2xl relative overflow-hidden select-none font-sans">
      
      <div className="flex justify-between items-center mb-2 bg-stone-900/90 p-2 rounded-2xl border border-amber-500/40">
        <button 
          onClick={handleClose}
          className="px-3.5 py-1.5 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-xs rounded-xl border border-red-500 active:scale-95 transition-all shadow-md flex items-center gap-1"
        >
          <span>←</span> Back
        </button>

        <div className="flex items-center gap-2 bg-black/80 px-3.5 py-1 rounded-xl border border-amber-500/50 shadow-inner">
          <span className="text-base">💰</span>
          <div>
            <p className="text-[9px] uppercase font-bold text-amber-400 leading-none">Wallet</p>
            <p className="text-sm font-black text-amber-300 leading-tight">৳ {currentBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center items-center h-44 overflow-hidden -my-1">
        <div className="absolute w-44 h-44 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <img 
          src="/images/garuda.gif" 
          alt="Animated Garuda" 
          className="w-48 h-48 object-contain z-10 mix-blend-screen drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]"
        />
      </div>

      <div className="text-center bg-gradient-to-r from-amber-900/80 via-yellow-700/80 to-amber-900/80 py-1.5 rounded-t-xl border-t-2 border-x-2 border-amber-400 mb-0.5">
        <h2 className="text-amber-200 font-black text-xs tracking-widest uppercase drop-shadow">FORTUNE GARUDA 500</h2>
      </div>

      <div className="flex gap-2 bg-stone-900 p-2 rounded-b-2xl border-2 border-amber-500/60 relative">
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

        <div className="w-16 flex flex-col justify-between bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950 p-1 rounded-xl border-2 border-amber-600/50 shadow-2xl">
          {MULTIPLIERS.map((m) => {
            const isActive = activeMultiplier === m;
            return (
              <div 
                key={m} 
                className={`w-full py-1.5 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-black border-2 border-yellow-100 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.9)] z-10' 
                    : 'bg-gradient-to-b from-stone-900 to-stone-950 text-amber-500/60 border border-amber-500/20 opacity-60'
                }`}
              >
                <span className={`drop-shadow-md ${isActive ? 'text-black text-sm font-black' : ''}`}>
                  {m}x
                </span>
              </div>
            );
          })}
        </div>

        {showCoins && (
          <div className="absolute inset-0 z-20 pointer-events-none flex justify-center items-center bg-black/85 rounded-2xl">
            <div className="text-center bg-gradient-to-b from-yellow-400 via-amber-500 to-amber-700 p-4 rounded-2xl border-2 border-yellow-200 shadow-[0_0_30px_rgba(245,158,11,1)] animate-bounce">
              <p className="text-black font-black text-2xl tracking-wider drop-shadow">🔥 WIN x{activeMultiplier}! 🔥</p>
              <p className="text-white text-2xl font-black mt-1 drop-shadow">৳ {winAmount}</p>
            </div>
          </div>
        )}
      </div>

      <div className="my-2 bg-stone-900/90 py-1.5 px-4 rounded-xl border border-amber-500/30 flex justify-between items-center">
        <span className="text-amber-400 font-extrabold text-xs tracking-wider">WIN</span>
        <span className="text-white font-black text-base">৳ {winAmount.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
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