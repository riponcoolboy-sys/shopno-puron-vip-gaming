import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Volume2, Info, RefreshCw, Zap, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { calculateRTPWin, determineRTPTier } from '../../utils/rtpManager';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface CrazySevenSlotsProps {
  balance: number;
  onUpdateBalance: (newBalance: number, amountWonOrLost: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

interface SymbolItem {
  id: string;
  name: string;
  icon: string;
  multiplier: number;
  color: string;
}

const SYMBOLS: SymbolItem[] = [
  { id: 'seven', name: '777 VIP', icon: '7️⃣', multiplier: 50, color: 'text-amber-400' },
  { id: 'diamond', name: 'Diamond', icon: '💎', multiplier: 25, color: 'text-cyan-400' },
  { id: 'bar', name: 'GOLD BAR', icon: '🪙', multiplier: 15, color: 'text-yellow-300' },
  { id: 'bell', name: 'Golden Bell', icon: '🔔', multiplier: 10, color: 'text-amber-200' },
  { id: 'star', name: 'Lucky Star', icon: '⭐', multiplier: 8, color: 'text-yellow-400' },
  { id: 'cherry', name: 'Cherry', icon: '🍒', multiplier: 5, color: 'text-red-400' },
  { id: 'lemon', name: 'Lemon', icon: '🍋', multiplier: 3, color: 'text-lime-400' },
];

export default function CrazySevenSlots({ balance, onUpdateBalance, onClose }: CrazySevenSlotsProps) {
  const [reels, setReels] = useState<[SymbolItem, SymbolItem, SymbolItem]>([
    SYMBOLS[0],
    SYMBOLS[0],
    SYMBOLS[0],
  ]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<number>(() => (balance > 0 && balance < 10 ? (balance >= 1 ? 1 : 0.5) : 1));
  const [lastWin, setLastWin] = useState<number>(0);
  const [lastMultiplier, setLastMultiplier] = useState<number>(0);
  const [winMessage, setWinMessage] = useState<string>('');
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [jackpotPool, setJackpotPool] = useState<number>(245890);

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Jackpot ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotPool((prev) => prev + Math.floor(Math.random() * 15 + 5));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Auto spin watcher
  useEffect(() => {
    if (autoSpinCount > 0 && !isSpinning) {
      const timer = setTimeout(() => {
        handleSpin();
        setAutoSpinCount((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoSpinCount, isSpinning]);

  const getRandomSymbol = (): SymbolItem => {
    const weights = [3, 8, 14, 20, 25, 30, 40]; // 777 is rare, lemon common
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) return SYMBOLS[i];
      rand -= weights[i];
    }
    return SYMBOLS[SYMBOLS.length - 1];
  };

  const handleSpin = () => {
    if (isSpinning) return;
    if (balance <= 0) {
      alert('আপনার ব্যালেন্স ৳০.০০! বাজি ধরার জন্য অনুগ্রহ করে রিচার্জ করুন।');
      setAutoSpinCount(0);
      return;
    }

    // কম ব্যালেন্স থাকলেও যাতে কোনো ব্লক ছাড়া বাজি ধরা যায় (অটো অ্যাডজাস্ট)
    const finalBet = getAffordableBet(balance, betAmount);
    if (finalBet === null) {
      alert('সঠিক বাজি নির্বাচন করুন');
      setAutoSpinCount(0);
      return;
    }

    sounds.playClick();
    const newBal = Math.max(0, balance - finalBet);
    onUpdateBalance(newBal, finalBet, 'BET', `Crazy Seven স্লট বাজি ৳${finalBet}`);

    setIsSpinning(true);
    setLastWin(0);
    setWinMessage('');

    let ticks = 0;
    const maxTicks = 18;

    spinIntervalRef.current = setInterval(() => {
      ticks++;
      sounds.playSpinTick();
      setReels([
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol(),
      ]);

      if (ticks >= maxTicks) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        finishSpin(finalBet);
      }
    }, 90);
  };

  const finishSpin = (activeBet: number) => {
    // Determine tier from 92%-94% Global RTP engine
    const rtpTier = determineRTPTier();
    let finalReels: [SymbolItem, SymbolItem, SymbolItem];

    if (rtpTier === 'HIGH') {
      // 2% probability: 777 VIP or Diamond triple
      const highSym = Math.random() < 0.5 ? SYMBOLS[0] : SYMBOLS[1];
      finalReels = [highSym, highSym, highSym];
    } else if (rtpTier === 'MEDIUM') {
      // 8% probability: Gold bar, Bell or Star match
      const medSym = SYMBOLS[Math.floor(Math.random() * 3 + 2)];
      finalReels = [medSym, medSym, medSym];
    } else if (rtpTier === 'LOW') {
      // 60% probability: Cherry, Lemon or 2-of-a-kind match
      const isTriple = Math.random() < 0.4;
      const lowSym = SYMBOLS[Math.floor(Math.random() * 2 + 5)];
      if (isTriple) {
        finalReels = [lowSym, lowSym, lowSym];
      } else {
        const anySym = getRandomSymbol();
        finalReels = [anySym, anySym, getRandomSymbol()];
      }
    } else {
      // 30% probability: Non matching
      finalReels = [SYMBOLS[6], SYMBOLS[5], SYMBOLS[4]];
    }

    setReels(finalReels);
    setIsSpinning(false);

    // Calculate payout
    let winMultiplier = 0;
    let desc = '';

    if (finalReels[0].id === finalReels[1].id && finalReels[1].id === finalReels[2].id) {
      // 3 of a kind
      winMultiplier = finalReels[0].multiplier;
      desc = `ট্রিপল ${finalReels[0].name} ম্যাচ! (${winMultiplier}X)`;
    } else if (finalReels[0].id === finalReels[1].id || finalReels[1].id === finalReels[2].id || finalReels[0].id === finalReels[2].id) {
      // 2 of a kind
      const matched = finalReels[0].id === finalReels[1].id ? finalReels[0] : (finalReels[1].id === finalReels[2].id ? finalReels[1] : finalReels[0]);
      winMultiplier = Math.max(1.5, Math.floor(matched.multiplier * 0.4));
      desc = `ডাবল ${matched.name} ম্যাচ! (${winMultiplier}X)`;
    }

    if (winMultiplier > 0 && rtpTier !== 'LOSS') {
      const rawWon = Math.floor(activeBet * winMultiplier);
      const won = calculateRTPWin(activeBet, rawWon, rtpTier);

      if (won > 0) {
        setLastWin(won);
        setLastMultiplier(parseFloat((won / activeBet).toFixed(1)));
        setWinMessage(desc);

        onUpdateBalance(balance - activeBet + won, won, 'WIN', `Crazy Seven জয় ৳${won} (${desc})`);

        sounds.playBigWin();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setWinMessage('পরবর্তী স্পিনে আবারও চেষ্টা করুন!');
      }
    } else {
      setWinMessage('পরবর্তী স্পিনে আবারও চেষ্টা করুন!');
    }
  };

  return (
    <div className="bg-[#0a0c14] text-white w-full max-w-md mx-auto min-h-screen sm:min-h-0 sm:max-h-[96vh] flex flex-col justify-between rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-amber-500/40 shadow-2xl relative select-none">
      {/* Header */}
      <div className="bg-[#151928] border-b border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-black text-lg italic tracking-wider">CRAZY SEVEN</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">JILI VIP</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-400 text-xs flex items-center gap-1"
          >
            <Info size={14} /> পে-টেবিল
          </button>
          <div className="bg-black/50 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="text-[10px] text-amber-400 font-bold">ব্যালেন্স:</span>
            <span className="text-sm font-black text-amber-300">৳{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Progressive Grand Jackpot Banner */}
      <div className="bg-gradient-to-r from-amber-900/60 via-yellow-900/40 to-amber-900/60 border-b border-amber-500/30 py-1.5 px-4 text-center">
        <span className="text-[10px] uppercase font-bold text-amber-300 tracking-widest flex items-center justify-center gap-1">
          👑 গ্র্যান্ড ভিআইপি জ্যাকপট পুল 👑
        </span>
        <span className="text-xl font-black text-amber-400 font-mono tracking-wider drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
          ৳{jackpotPool.toLocaleString()}
        </span>
      </div>

      {/* Paytable Modal View */}
      {showPaytable && (
        <div className="bg-[#121626] p-3 border-b border-amber-500/30 animate-in fade-in duration-150">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-amber-400">পুরস্কার তালিকা (PAYTABLE MULTIPLIERS)</span>
            <button onClick={() => setShowPaytable(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ</button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {SYMBOLS.map((s) => (
              <div key={s.id} className="bg-[#0a0c14] p-1.5 rounded-lg border border-gray-800">
                <span className="text-xl">{s.icon}</span>
                <p className="text-[10px] font-bold text-gray-300 truncate">{s.name}</p>
                <p className="text-xs font-mono font-black text-amber-400">{s.multiplier}X</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slot Machine Reels View */}
      <div className="flex-1 min-h-[220px] bg-gradient-to-b from-[#0e1220] via-[#141829] to-[#0a0d18] p-4 flex flex-col items-center justify-center relative">
        {/* Machine Housing Frame */}
        <div className="w-full max-w-sm bg-[#181d33] border-4 border-amber-500/60 rounded-3xl p-3 shadow-[0_0_40px_rgba(245,158,11,0.25)] relative">
          {/* Win line beam */}
          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-amber-400/40 pointer-events-none z-10" />

          {/* 3 Reels Grid */}
          <div className="grid grid-cols-3 gap-2 bg-[#0a0d16] p-2 rounded-2xl border-2 border-gray-800 shadow-inner">
            {reels.map((symbol, idx) => (
              <div
                key={idx}
                className={`h-28 bg-gradient-to-b from-[#121629] via-[#1a2038] to-[#121629] rounded-xl flex flex-col items-center justify-center border border-amber-500/20 shadow-md relative overflow-hidden transition-transform ${
                  isSpinning ? 'animate-pulse scale-95' : 'scale-100'
                }`}
              >
                <span className="text-4xl filter drop-shadow-md mb-1">{symbol.icon}</span>
                <span className={`text-[10px] font-bold tracking-tight uppercase ${symbol.color}`}>
                  {symbol.name}
                </span>
                {!isSpinning && (
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5">{symbol.multiplier}x</span>
                )}
              </div>
            ))}
          </div>

          {/* Win Announcer */}
          <div className="mt-3 text-center min-h-[32px] flex items-center justify-center">
            {lastWin > 0 ? (
              <div className="animate-bounce bg-amber-400/20 border border-amber-400/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-300" />
                <span className="text-xs font-black text-amber-300">
                  {winMessage} — ৳{lastWin.toLocaleString()} জয়!
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-gray-400 font-medium">স্পিন করুন এবং ট্রিপল সেভেন জ্যাকপট জিতুন</span>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#121524] p-4 space-y-3 border-t border-gray-800">
        {/* Bet presets: [1, 2, 5, 10, 20, 50] */}
        <div className="flex gap-1">
          {balance > 0 && balance < 10 && (
            <button
              disabled={isSpinning}
              onClick={() => { sounds.playClick(); setBetAmount(0.5); }}
              className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                betAmount === 0.5
                  ? 'bg-amber-400 text-black border-amber-300 font-black'
                  : 'bg-[#0a0c16] text-amber-300 border-amber-500/40 hover:text-white'
              }`}
            >
              ৳০.৫
            </button>
          )}
          {BET_PRESETS.map((amt) => (
            <button
              key={amt}
              disabled={isSpinning}
              onClick={() => { sounds.playClick(); setBetAmount(amt); }}
              className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                betAmount === amt
                  ? 'bg-amber-400 text-black border-amber-300 font-black'
                  : 'bg-[#0a0c16] text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              ৳{amt}
            </button>
          ))}
        </div>

        {/* Spin Actions */}
        <div className="grid grid-cols-12 gap-2">
          {/* Bet adjust */}
          <div className="col-span-4 bg-[#0a0c16] border border-gray-800 rounded-xl p-2 flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase">বাজি (BET)</span>
            <div className="flex items-center justify-between">
              <button
                disabled={isSpinning}
                onClick={() => {
                  sounds.playClick();
                  setBetAmount((prev) => {
                    if (prev <= 1) return 0.5;
                    if (prev <= 2) return 1;
                    if (prev <= 5) return 2;
                    if (prev <= 10) return 5;
                    if (prev <= 20) return 10;
                    return Math.max(1, prev - 10);
                  });
                }}
                className="w-6 h-6 bg-gray-800 rounded text-xs font-bold text-gray-300 hover:bg-gray-700 flex items-center justify-center"
              >
                -
              </button>
              <span className="text-sm font-mono font-black text-amber-400">৳{betAmount}</span>
              <button
                disabled={isSpinning}
                onClick={() => {
                  sounds.playClick();
                  setBetAmount((prev) => {
                    if (prev < 1) return 1;
                    if (prev < 2) return 2;
                    if (prev < 5) return 5;
                    if (prev < 10) return 10;
                    if (prev < 20) return 20;
                    if (prev < 50) return 50;
                    return prev + 10;
                  });
                }}
                className="w-6 h-6 bg-gray-800 rounded text-xs font-bold text-gray-300 hover:bg-gray-700 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Auto Spin Toggle */}
          <div className="col-span-3">
            <button
              disabled={isSpinning && autoSpinCount === 0}
              onClick={() => {
                sounds.playClick();
                if (autoSpinCount > 0) {
                  setAutoSpinCount(0);
                } else {
                  setAutoSpinCount(10);
                }
              }}
              className={`w-full h-full min-h-[54px] rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition ${
                autoSpinCount > 0
                  ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                  : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <RefreshCw size={14} className={autoSpinCount > 0 ? 'animate-spin' : ''} />
              <span>{autoSpinCount > 0 ? `অটো (${autoSpinCount})` : 'অটো স্পিন'}</span>
            </button>
          </div>

          {/* Big Spin Button */}
          <div className="col-span-5">
            <button
              disabled={isSpinning}
              onClick={handleSpin}
              className={`w-full h-full min-h-[54px] rounded-xl font-black text-base transition flex flex-col items-center justify-center shadow-lg border-2 ${
                isSpinning
                  ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-black border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
              }`}
            >
              <span>{isSpinning ? 'ঘুরছে...' : 'স্পিন (SPIN)'}</span>
              <span className="text-[10px] opacity-80">৳{betAmount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
