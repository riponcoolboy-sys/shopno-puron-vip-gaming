import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { sounds } from '../../utils/audio';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface DragonTigerGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number, amount: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export default function DragonTigerGame({ balance, onUpdateBalance, onClose }: DragonTigerGameProps) {
  const [betAmount, setBetAmount] = useState<number>(1);
  const [side, setSide] = useState<'dragon' | 'tie' | 'tiger'>('dragon');
  const [cards, setCards] = useState({ dragon: '?', tiger: '?' });
  const [message, setMessage] = useState('Choose a side and deal');
  const [isDealing, setIsDealing] = useState(false);

  const deal = () => {
    if (isDealing) return;
    const finalBet = getAffordableBet(balance, betAmount);
    if (finalBet === null) {
      setMessage('Minimum bet is ৳1');
      return;
    }
    sounds.playClick();
    setIsDealing(true);
    const dragon = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
    const tiger = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
    const winner = dragon === tiger ? 'tie' : Math.random() < 0.5 ? 'dragon' : 'tiger';
    const payout = winner === side ? finalBet * (winner === 'tie' ? 8 : 2) : 0;
    const nextBalance = balance - finalBet + payout;
    onUpdateBalance(balance - finalBet, finalBet, 'BET', `Dragon Tiger bet: ৳${finalBet}`);
    window.setTimeout(() => {
      setCards({ dragon, tiger });
      setIsDealing(false);
      if (payout > 0) onUpdateBalance(nextBalance, payout, 'WIN', `Dragon Tiger win: ৳${payout}`);
      setMessage(payout > 0 ? `You won ৳${payout}` : `Winner: ${winner.toUpperCase()}`);
    }, 650);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-0 rounded-2xl bg-gradient-to-b from-emerald-950 via-slate-950 to-red-950 p-5 text-white border border-emerald-400/40 shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/10 pb-3">
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-slate-300"><ArrowLeft size={15} /> Back</button>
        <div className="text-center"><h2 className="font-black tracking-widest text-emerald-300">DRAGON TIGER</h2><span className="flex items-center gap-1 text-[9px] text-emerald-200"><ShieldCheck size={11} /> LIVE TABLE</span></div>
        <span className="text-xs font-bold text-amber-300">৳{balance.toLocaleString()}</span>
      </header>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {(['dragon', 'tiger'] as const).map((name) => <div key={name} className={`rounded-xl border p-6 text-center ${name === 'dragon' ? 'border-emerald-400/50 bg-emerald-900/40' : 'border-red-400/50 bg-red-900/40'}`}><div className="text-xs font-black uppercase tracking-widest">{name}</div><div className="mt-2 text-5xl font-black">{cards[name]}</div></div>)}
      </div>
      <p className="my-5 text-center text-sm text-amber-200">{message}</p>
      <div className="grid grid-cols-3 gap-2">{(['dragon', 'tie', 'tiger'] as const).map((item) => <button key={item} disabled={isDealing} onClick={() => setSide(item)} className={`rounded-lg border py-3 text-xs font-black uppercase ${side === item ? 'border-amber-300 bg-amber-400/20 text-amber-200' : 'border-white/15 text-slate-300'}`}>{item}</button>)}</div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">{BET_PRESETS.map((value) => <button key={value} disabled={isDealing} onClick={() => setBetAmount(value)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${betAmount === value ? 'border-amber-300 bg-amber-400/20 text-amber-200' : 'border-white/15 text-slate-300'}`}>৳{value}</button>)}</div>
      <button disabled={isDealing || balance < 1} onClick={deal} className="mt-5 w-full rounded-xl bg-amber-400 py-3 font-black text-slate-950 disabled:opacity-50">{isDealing ? 'DEALING...' : 'DEAL CARDS'}</button>
    </div>
  );
}