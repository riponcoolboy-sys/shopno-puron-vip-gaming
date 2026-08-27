// @ts-nocheck
import React, { useState } from 'react';

interface PixiSlotGameProps {
  balance: number;
  onUpdateBalance: (amount: number) => void;
  onClose: () => void;
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

export default function PixiSlotGame({ balance, onUpdateBalance, onClose }: PixiSlotGameProps) {
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  // Initial random symbols in grid
  const [grid, setGrid] = useState<string[]>(() => 
    Array(9).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].img)
  );
  const [showCoins, setShowCoins] = useState(false);

  const playSound = (soundName: string) => {
    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleSpin = () => {
    if (balance < bet || isSpinning) return;

    playSound('click');
    playSound('spin');
    onUpdateBalance(-bet);
    setIsSpinning(true);
    setWinAmount(0);
    setShowCoins(false);

    let counter = 0;
    const interval = setInterval(() => {
      const randomGrid = Array(9).fill(0).map(() => 
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].img
      );
      setGrid(randomGrid);
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        evaluateWin(randomGrid);
        setIsSpinning(false);
      }
    }, 100);
  };

  const evaluateWin = (finalGrid: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 4, 8], [2, 4, 6]            
    ];

    let totalWin = 0;

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
          totalWin += bet * symbolObj.payout;
        }
      }
    });

    if (totalWin > 0) {
      setWinAmount(totalWin);
      onUpdateBalance(totalWin);
      setShowCoins(true);

      if (totalWin >= bet * 20) {
        playSound('big-win');
      } else {
        playSound('win');
      }
      playSound('coin');

      setTimeout(() => setShowCoins(false), 4000);
    }
  };

  return (
    <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 border-4 border-amber-500 rounded-3xl p-4 text-white shadow-2xl overflow-hidden">
      
      {/* 1. Header with Balance & Clear Back Button */}
      <div className="flex justify-between items-center mb-3 bg-black/70 p-3 rounded-2xl border border-amber-500/40">
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400">ব্যালেন্স</p>
          <p className="text-xl font-extrabold text-amber-400">৳ {balance.toLocaleString()}</p>
        </div>
        <button 
          onClick={() => { playSound('click'); onClose(); }}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs rounded-xl shadow-lg border border-red-400 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>✕</span> বন্ধ করুন (Back)
        </button>
      </div>

      {/* 2. Floating Animated Garuda Character */}
      <div className="relative flex justify-center items-center my-1">
        <div className="absolute w-28 h-28 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
        <img 
          src="/images/garuda.png" 
          alt="Animated Garuda" 
          className="w-24 h-24 object-contain z-10 animate-bounce transition-all duration-700 hover:scale-110 drop-shadow-[0_10px_15px_rgba(245,158,11,0.4)]"
          style={{ animationDuration: '2s' }}
        />
      </div>

      {/* 3. 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2 bg-black/80 p-3.5 rounded-2xl border-2 border-amber-500/50 relative">
        {grid.map((imgSrc, idx) => (
          <div 
            key={idx} 
            className={`aspect-square bg-slate-900 border border-amber-500/30 rounded-xl flex items-center justify-center p-2 shadow-inner transition-all ${
              isSpinning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
            }`}
          >
            <img 
              src={imgSrc} 
              alt="symbol" 
              className={`w-full h-full object-contain ${isSpinning ? 'animate-pulse' : ''}`}
            />
          </div>
        ))}

        {/* Win Modal */}
        {showCoins && (
          <div className="absolute inset-0 z-20 pointer-events-none flex justify-center items-center bg-black/70 rounded-2xl">
            <div className="text-center bg-gradient-to-b from-amber-400 to-amber-600 p-5 rounded-2xl border-2 border-yellow-200 shadow-2xl animate-bounce">
              <p className="text-black font-black text-3xl">BIG WIN!</p>
              <p className="text-white text-2xl font-bold mt-1">৳ {winAmount}</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Controls */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex justify-between items-center bg-black/60 p-2.5 rounded-2xl border border-amber-500/30">
          <button 
            onClick={() => { playSound('click'); setBet(prev => Math.max(10, prev - 10)); }}
            className="w-10 h-10 bg-slate-800 border border-amber-500/40 rounded-xl font-black text-xl text-amber-400 hover:bg-slate-700"
          >
            -
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase text-gray-400">বেট অ্যামাউন্ট</p>
            <p className="font-bold text-amber-300">৳ {bet}</p>
          </div>
          <button 
            onClick={() => { playSound('click'); setBet(prev => prev + 10); }}
            className="w-10 h-10 bg-slate-800 border border-amber-500/40 rounded-xl font-black text-xl text-amber-400 hover:bg-slate-700"
          >
            +
          </button>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning || balance < bet}
          className={`w-full py-4 rounded-2xl font-black text-2xl tracking-widest shadow-xl border-2 transition-all ${
            isSpinning || balance < bet
              ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black border-yellow-300 hover:brightness-110 active:scale-95'
          }`}
        >
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>

    </div>
  );
}