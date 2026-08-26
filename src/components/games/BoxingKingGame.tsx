import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Flame, ShieldAlert, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { calculateRTPWin } from '../../utils/rtpManager';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface BoxingKingGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number, amountWonOrLost: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

const BOXING_SYMBOLS = [
  { name: 'CHAMPION BELT', icon: '🥊', mult: 30, color: 'text-amber-400' },
  { name: 'GOLD TROPHY', icon: '🏆', mult: 20, color: 'text-yellow-300' },
  { name: 'FIGHT GLOVE', icon: '🥇', mult: 10, color: 'text-red-400' },
  { name: 'RING BELL', icon: '🔔', mult: 5, color: 'text-orange-400' },
  { name: 'ENERGY DRINK', icon: '⚡', mult: 3, color: 'text-cyan-400' },
];

export default function BoxingKingGame({ balance, onUpdateBalance, onClose }: BoxingKingGameProps) {
  const [combo, setCombo] = useState<number>(1);
  const [betAmount, setBetAmount] = useState<number>(1);
  const [isFighting, setIsFighting] = useState<boolean>(false);
  const [fighterGrid, setFighterGrid] = useState([
    BOXING_SYMBOLS[0], BOXING_SYMBOLS[1], BOXING_SYMBOLS[2],
    BOXING_SYMBOLS[3], BOXING_SYMBOLS[0], BOXING_SYMBOLS[4]
  ]);
  const [fightOutcome, setFightOutcome] = useState<string>('রিং-এ প্রবেশ করুন এবং ঘুষি মেরে নকআউট করুন!');
  const [lastWin, setLastWin] = useState<number>(0);


  const handlePunchSpin = () => {
    if (isFighting) return;
    if (balance <= 0) {
      alert('আপনার ব্যালেন্স ৳০.০০! বাজি ধরার জন্য অনুগ্রহ করে রিচার্জ করুন।');
      return;
    }

    // কম ব্যালেন্স থাকলেও যাতে কোনো ব্লক ছাড়া বাজি ধরা যায় (অটো অ্যাডজাস্ট)
    const finalBet = getAffordableBet(balance, betAmount);
    if (finalBet === null) {
      alert('সঠিক বাজি নির্বাচন করুন');
      return;
    }

    sounds.playClick();
    const newBal = Math.max(0, balance - finalBet);
    onUpdateBalance(newBal, finalBet, 'BET', `Boxing King ফাইট বাজি ৳${finalBet}`);

    setIsFighting(true);
    setLastWin(0);
    setFightOutcome('ফাইট চলছে! কম্বো ঘুষি মারা হচ্ছে...');

    let punches = 0;
    const punchInterval = setInterval(() => {
      punches++;
      sounds.playSpinTick();
      setFighterGrid([
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
        BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)],
      ]);

      if (punches >= 14) {
        clearInterval(punchInterval);
        resolveFight(finalBet);
      }
    }, 80);
  };

  const resolveFight = (activeBet: number) => {
    setIsFighting(false);

    const symbol = BOXING_SYMBOLS[Math.floor(Math.random() * BOXING_SYMBOLS.length)];
    const rawWon = Math.floor(activeBet * Math.min(3, symbol.mult));
    const won = calculateRTPWin(activeBet, rawWon);

    if (won > 0) {
      const nextCombo = Math.min(3, combo + 1);
      setCombo(nextCombo);

      setLastWin(won);
      setFightOutcome(`K.O.! সুপার পাঞ্চ জয়! ৳${won.toLocaleString()} লাভ!`);
      sounds.playBigWin();
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      onUpdateBalance(balance - activeBet + won, won, 'WIN', `Boxing King জয় ৳${won}`);
    } else {
      setCombo(1);
      setFightOutcome('প্রতিপক্ষ ব্লক করেছে! পরবর্তী রাউন্ডে আবারও ঘুষি দিন।');
    }
  };

  return (
    <div className="bg-[#0a0c14] text-white w-full max-w-md mx-auto min-h-screen sm:min-h-0 sm:max-h-[96vh] flex flex-col justify-between rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-red-500/40 shadow-2xl relative select-none">
      {/* Top Bar */}
      <div className="bg-[#1b1216] border-b border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-red-500 font-black text-lg italic tracking-wider">BOXING KING</span>
            <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-500/30">JILI VIP</span>
          </div>
        </div>

        <div className="bg-black/50 border border-red-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="text-[10px] text-red-400 font-bold">ব্যালেন্স:</span>
          <span className="text-sm font-black text-amber-300">৳{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Combo Multiplier Bar */}
      <div className="bg-gradient-to-r from-red-950 via-red-900/60 to-black px-4 py-2 border-b border-red-500/30 flex items-center justify-between">
        <span className="text-xs font-bold text-red-300 flex items-center gap-1">
          <Flame size={14} className="text-amber-400 animate-pulse" /> কম্বো পাওয়ার মিটার:
        </span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <span
              key={lvl}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                combo >= lvl
                  ? 'bg-amber-400 text-black border border-yellow-200'
                  : 'bg-black/50 text-gray-500 border border-gray-800'
              }`}
            >
              {lvl}X
            </span>
          ))}
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 min-h-[220px] bg-gradient-to-b from-[#140c10] via-[#201017] to-[#0a0c14] p-4 flex flex-col items-center justify-center relative">
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs bg-[#100a0d] p-3 rounded-2xl border-2 border-red-600/40 shadow-inner">
          {fighterGrid.map((sym, idx) => (
            <div
              key={idx}
              className={`h-20 bg-gradient-to-b from-[#24121a] to-[#160b10] rounded-xl flex flex-col items-center justify-center border border-red-500/20 shadow-md ${
                isFighting ? 'animate-bounce' : ''
              }`}
            >
              <span className="text-3xl">{sym.icon}</span>
              <span className="text-[9px] font-bold text-gray-300 uppercase mt-0.5">{sym.name}</span>
            </div>
          ))}
        </div>

        {/* Fight Outcome Status */}
        <div className="mt-3 text-center min-h-[30px] flex items-center justify-center">
          <p className="text-xs font-bold text-amber-300">{fightOutcome}</p>
        </div>
      </div>

      {/* Action Controls: [1, 2, 5, 10, 20, 50] */}
      <div className="bg-[#180e14] p-4 space-y-3 border-t border-gray-800">
        <div className="flex gap-1 overflow-x-auto">
          {balance > 0 && balance < 10 && (
            <button
              disabled={isFighting}
              onClick={() => { sounds.playClick(); setBetAmount(0.5); }}
              className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                betAmount === 0.5
                  ? 'bg-red-500 text-white border-red-300 font-black shadow-md'
                  : 'bg-[#0a0c16] text-amber-300 border-red-500/40 hover:text-white'
              }`}
            >
              ৳০.৫
            </button>
          )}
          {BET_PRESETS.map((amt) => (
            <button
              key={amt}
              disabled={isFighting}
              onClick={() => { sounds.playClick(); setBetAmount(amt); }}
              className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                betAmount === amt
                  ? 'bg-red-500 text-white border-red-300 font-black shadow-md'
                  : 'bg-[#0a0c16] text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              ৳{amt}
            </button>
          ))}
        </div>

        <button
          disabled={isFighting}
          onClick={handlePunchSpin}
          className={`w-full py-3.5 rounded-xl font-black text-base transition flex items-center justify-center gap-2 border-2 ${
            isFighting
              ? 'bg-gray-800 text-gray-500 border-gray-700'
              : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:brightness-110 active:scale-95 text-white border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
          }`}
        >
          <span>🥊 {isFighting ? 'পাঞ্চ চলছে...' : 'হেভি পাঞ্চ ফাইট (PUNCH SPIN)'}</span>
          <span className="text-xs bg-black/40 px-2 py-0.5 rounded font-mono">৳{betAmount}</span>
        </button>
      </div>
    </div>
  );
}
