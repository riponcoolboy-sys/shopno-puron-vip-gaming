import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { sounds } from '../../utils/audio';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface CatalogMiniGameProps {
  title: string;
  balance: number;
  onUpdateBalance: (newBalance: number, amount: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

export default function CatalogMiniGame({ title, balance, onUpdateBalance, onClose }: CatalogMiniGameProps) {
  const [betAmount, setBetAmount] = useState(1);
  const [result, setResult] = useState('Ready to play');
  const [isPlaying, setIsPlaying] = useState(false);

  const play = () => {
    if (isPlaying) return;
    const finalBet = getAffordableBet(balance, betAmount);
    if (finalBet === null) {
      setResult('Minimum bet is ৳1');
      return;
    }
    sounds.playClick();
    setIsPlaying(true);
    const won = Math.random() < 0.42;
    const winAmount = won ? finalBet * 2 : 0;
    onUpdateBalance(balance - finalBet, finalBet, 'BET', `${title} bet: ৳${finalBet}`);
    window.setTimeout(() => {
      setIsPlaying(false);
      if (winAmount > 0) onUpdateBalance(balance - finalBet + winAmount, winAmount, 'WIN', `${title} win: ৳${winAmount}`);
      setResult(winAmount > 0 ? `WIN ৳${winAmount}` : 'No win this round');
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-0 rounded-2xl bg-slate-950 p-5 text-white border border-amber-400/30 shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/10 pb-3"><button onClick={onClose} className="flex items-center gap-1 text-xs text-slate-300"><ArrowLeft size={15} /> Back</button><h2 className="max-w-[65%] truncate text-sm font-black tracking-widest text-amber-300">{title.toUpperCase()}</h2><span className="text-xs font-bold text-emerald-300">৳{balance.toLocaleString()}</span></header>
      <div className="my-8 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/50 to-slate-900 p-10 text-center"><Sparkles className="mx-auto text-amber-300" size={36} /><p className="mt-4 text-sm text-amber-100">{result}</p></div>
      <div className="flex flex-wrap justify-center gap-2">{BET_PRESETS.map((value) => <button key={value} disabled={isPlaying} onClick={() => setBetAmount(value)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${betAmount === value ? 'border-amber-300 bg-amber-400/20 text-amber-200' : 'border-white/15 text-slate-300'}`}>৳{value}</button>)}</div>
      <button disabled={isPlaying || balance < 1} onClick={play} className="mt-5 w-full rounded-xl bg-amber-400 py-3 font-black text-slate-950 disabled:opacity-50">{isPlaying ? 'PLAYING...' : `PLAY ৳${betAmount}`}</button>
    </div>
  );
}
