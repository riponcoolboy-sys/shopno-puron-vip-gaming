import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Crown, Gem, Info, Sparkles } from 'lucide-react';
import { apiUrl } from '../../utils/security';
import { sounds } from '../../utils/audio';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface SuperAceGameProps {
  balance: number;
  userId?: string;
  onUpdateBalance: (newBalance: number, amountWonOrLost: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

const SYMBOLS = [
  { id: 'ACE', icon: 'A', multiplier: 8, color: 'text-cyan-300' },
  { id: 'GEM', icon: '◆', multiplier: 15, color: 'text-fuchsia-300' },
  { id: 'CROWN', icon: '♛', multiplier: 30, color: 'text-amber-300' },
  { id: 'SEVEN', icon: '7', multiplier: 50, color: 'text-red-300' },
];

type Reel = (typeof SYMBOLS)[number];
const GRID_SIZE = 20;
const GRID_COLUMNS = 5;

const getWinningIndexes = (grid: Reel[]) => {
  const winningIndexes = new Set<number>();

  for (let row = 0; row < GRID_SIZE / GRID_COLUMNS; row++) {
    const rowStart = row * GRID_COLUMNS;
    let runStart = rowStart;

    for (let column = 1; column <= GRID_COLUMNS; column++) {
      const previous = grid[rowStart + column - 1];
      const current = grid[rowStart + column];
      if (column < GRID_COLUMNS && current?.id === previous.id) continue;

      if (column - (runStart - rowStart) >= 3) {
        for (let index = runStart; index < rowStart + column; index++) winningIndexes.add(index);
      }
      runStart = rowStart + column;
    }
  }

  return winningIndexes;
};

export default function SuperAceGame({ balance, userId, onUpdateBalance, onClose }: SuperAceGameProps) {
  const [reels, setReels] = useState<Reel[]>(Array.from({ length: GRID_SIZE }, (_, index) => SYMBOLS[index % SYMBOLS.length]));
  const [betAmount, setBetAmount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('Choose a stake and spin the reels');
  const [lastWin, setLastWin] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const randomReels = (): Reel[] => Array.from({ length: GRID_SIZE }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

  const finishSpin = (activeBet: number, result: { reels: string[]; winAmount: number; currentBalance: number }) => {
    const resultReels = Array.from({ length: GRID_SIZE }, (_, index) => SYMBOLS.find((symbol) => symbol.id === result.reels[index]) || SYMBOLS[index % SYMBOLS.length]);
    const winningIndexes = getWinningIndexes(resultReels);
    const win = Number(result.winAmount) || 0;
    setReels(resultReels);
    setLastWin(win);
    setIsSpinning(false);
    if (win > 0) {
      setMessage(`WIN ৳${win.toLocaleString()} · ${winningIndexes.size} matching cards`);
      sounds.playWin();
      onUpdateBalance(Number(result.currentBalance), win, 'WIN', `Super Ace win: ৳${win}`);
    } else {
      setMessage('No match this round. Spin again.');
    }
  };

  const spin = async () => {
    if (isSpinning) return;
    const activeBet = getAffordableBet(balance, betAmount);
    if (activeBet === null) {
      setMessage('Insufficient balance');
      return;
    }

    setIsSpinning(true);
    setLastWin(0);
    setMessage('Reels are spinning...');
    timerRef.current = setInterval(() => {
      sounds.playSpinTick();
      setReels(randomReels());
    }, 90);

    try {
      const response = await fetch(apiUrl('/api/game/super-ace/spin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, betAmount: activeBet }),
      });
      const result = await response.json();
      setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (result.success) {
          onUpdateBalance(Number(result.currentBalance), activeBet, 'BET', `Super Ace bet: ৳${activeBet}`);
          finishSpin(activeBet, result);
        }
        else {
          setIsSpinning(false);
          setMessage(result.message || 'Spin unavailable');
        }
      }, 700);
    } catch {
      setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsSpinning(false);
        setMessage('Game server unavailable. Please try again.');
      }, 700);
    }
  };

  const winningIndexes = getWinningIndexes(reels);

  return (
    <div className="w-full min-h-screen sm:min-h-0 bg-[#07131c] text-white p-4 sm:p-5 sm:rounded-2xl border border-cyan-400/30 shadow-2xl">
      <div className="flex items-center justify-between border-b border-cyan-300/20 pb-3">
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-slate-300"><ArrowLeft size={15} /> Back</button>
        <div className="flex items-center gap-2 font-black tracking-widest text-cyan-300"><Crown size={17} /> SUPER ACE</div>
        <div className="text-right"><Info size={16} className="ml-auto text-slate-400" /><div className="text-[10px] font-bold text-emerald-300">৳{balance.toLocaleString()}</div></div>
      </div>
      <div className="mt-5 rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-950/70 to-slate-950 p-4 text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-cyan-200">Jackpot lane</div>
        <div className="mt-1 text-2xl font-black text-amber-300">৳ 128,640</div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1.5 rounded-xl border-2 border-cyan-300/40 bg-slate-950 p-2 sm:gap-2 sm:p-3">
        {reels.map((reel, index) => <div key={index} className={`aspect-square min-w-0 flex flex-col items-center justify-center rounded-lg border ${!isSpinning && winningIndexes.has(index) ? 'border-amber-300 bg-amber-300/15 shadow-[0_0_12px_rgba(252,211,77,0.5)]' : 'border-white/10 bg-slate-900'} ${isSpinning ? 'animate-pulse' : ''}`}><span className={`text-2xl font-black sm:text-4xl ${reel.color}`}>{reel.icon}</span><span className="truncate text-[8px] text-slate-400 sm:text-[10px]">{reel.id}</span></div>)}
      </div>
      <div className="mt-4 min-h-8 text-center text-sm text-cyan-100">{lastWin > 0 ? <span className="font-bold text-emerald-300"><Sparkles size={15} className="mr-1 inline" />{message}</span> : message}</div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {BET_PRESETS.map((value) => <button key={value} onClick={() => setBetAmount(value)} className={`min-w-12 rounded-lg border px-3 py-2 text-xs font-bold ${betAmount === value ? 'border-cyan-300 bg-cyan-400/20 text-cyan-200' : 'border-slate-700 text-slate-300'}`}>৳{value}</button>)}
      </div>
      <button disabled={isSpinning || balance <= 0} onClick={() => { sounds.playClick(); spin(); }} className="mt-4 w-full rounded-xl bg-cyan-400 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><Gem size={17} className="mr-2 inline" />{isSpinning ? 'SPINNING...' : `SPIN ৳${Math.min(betAmount, balance).toFixed(2)}`}</button>
      <div className="mt-3 text-center text-xs text-slate-400">Balance: <span className="font-bold text-white">৳{balance.toFixed(2)}</span></div>
    </div>
  );
}
