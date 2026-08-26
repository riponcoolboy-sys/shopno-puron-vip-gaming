import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { apiUrl } from '../../utils/security';
import { sounds } from '../../utils/audio';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface CanvasGameProps {
  title: string;
  gameId: string;
  balance: number;
  userId?: string;
  color: string;
  onUpdateBalance: (newBalance: number, amount: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

const icons = ['7', '◆', '★', 'A', '●', '✦'];

export default function CanvasGame({ title, gameId, balance, userId, color, onUpdateBalance, onClose }: CanvasGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bet, setBet] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [message, setMessage] = useState('Choose a stake to play');
  const [lastWin, setLastWin] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let frame = 0;
    const draw = () => {
      const width = canvas.clientWidth * 2;
      const height = canvas.clientHeight * 2;
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      context.fillStyle = '#09121d';
      context.fillRect(0, 0, width, height);
      context.strokeStyle = `${color}66`;
      context.lineWidth = 3;
      for (let i = 1; i < 5; i += 1) { context.beginPath(); context.moveTo(width * i / 5, 0); context.lineTo(width * i / 5, height); context.stroke(); }
      for (let i = 0; i < 4; i += 1) { context.beginPath(); context.moveTo(0, height * i / 4); context.lineTo(width, height * i / 4); context.stroke(); }
      context.font = `bold ${Math.max(26, width / 11)}px sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      for (let row = 0; row < 4; row += 1) for (let column = 0; column < 5; column += 1) {
        const offset = playing ? Math.floor(frame / 3) : 0;
        context.fillStyle = row === 1 && column === 2 ? '#facc15' : '#e8f1f2';
        context.fillText(icons[(row * 5 + column + offset) % icons.length], width * (column + 0.5) / 5, height * (row + 0.5) / 4);
      }
      frame += 1;
      if (playing) requestAnimationFrame(draw);
    };
    draw();
  }, [color, playing]);

  const play = async () => {
    const activeBet = getAffordableBet(balance, bet);
    if (playing || activeBet === null || !userId) {
      setMessage(!userId ? 'Sign in to play' : 'Insufficient balance');
      return;
    }
    setPlaying(true); setLastWin(0); setMessage('Round in progress...');
    if (!muted) sounds.playSpinTick();
    try {
      const response = await fetch(apiUrl('/api/game/play'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, gameId, betAmount: activeBet }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Round unavailable');
      setTimeout(() => {
        setPlaying(false);
        onUpdateBalance(Number(result.balance), 0, 'WIN', `SERVER_SETTLED ${title} bet: ৳${activeBet}`);
        if (result.winAmount > 0) {
          setLastWin(result.winAmount); setMessage(`WIN ৳${result.winAmount.toLocaleString()}`); if (!muted) sounds.playWin();
        } else { setMessage('No win this round'); if (!muted) sounds.playCrash(); }
      }, 650);
    } catch (error) { setPlaying(false); setMessage(error instanceof Error ? error.message : 'Game server unavailable'); }
  };

  return <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-0 rounded-2xl bg-[#07131c] p-4 text-white border shadow-2xl" style={{ borderColor: `${color}88` }}>
    <header className="flex items-center justify-between border-b border-white/10 pb-3">
      <button onClick={onClose} className="flex items-center gap-1 text-xs text-slate-300"><ArrowLeft size={15} /> Back</button>
      <h2 className="max-w-[55%] truncate text-sm font-black tracking-widest" style={{ color }}>{title.toUpperCase()}</h2>
      <div className="text-right"><div className="text-[10px] text-slate-400">WALLET</div><div className="text-sm font-black text-emerald-300">৳{balance.toLocaleString()}</div></div>
    </header>
    <canvas ref={canvasRef} className="mt-5 h-72 w-full rounded-xl border-2 bg-[#0b1722]" style={{ borderColor: `${color}55` }} aria-label={`${title} game board`} />
    <div className="mt-3 flex min-h-8 items-center justify-center text-center text-sm">{lastWin > 0 ? <span className="font-bold text-emerald-300">{message}</span> : message}</div>
    <div className="mt-4 flex flex-wrap justify-center gap-2">{BET_PRESETS.map((value) => <button key={value} disabled={playing} onClick={() => { setBet(value); if (!muted) sounds.playClick(); }} className={`min-w-12 rounded-lg border px-3 py-2 text-xs font-bold ${bet === value ? 'border-amber-300 bg-amber-400/20 text-amber-200' : 'border-slate-700 text-slate-300'}`}>৳{value}</button>)}</div>
    <div className="mt-4 flex gap-2"><button disabled={playing || balance < bet || !userId} onClick={play} className="flex-1 rounded-xl py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: color }}>{playing ? 'PLAYING...' : `PLAY ৳${bet}`}</button><button title="Toggle sound" onClick={() => setMuted((value) => !value)} className="rounded-xl border border-white/15 px-4 text-slate-300">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button></div>
    <div className="mt-3 text-center text-xs text-slate-400">Balance: <span className="font-bold text-white">৳{balance.toFixed(2)}</span></div>
  </div>;
}
