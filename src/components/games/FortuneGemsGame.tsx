import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Volume2, Info, RefreshCw, Zap, Award, Gem } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { apiUrl } from '../../utils/security';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface FortuneGemsGameProps {
  balance: number;
  userId?: string;
  onUpdateBalance: (newBalance: number, amountWonOrLost: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

interface FortuneSymbol {
  id: string;
  name: string;
  payout3x: number;
  icon: string;
  color: string;
  bgColor: string;
}

const FORTUNE_SYMBOLS: Record<string, FortuneSymbol> = {
  WILD: { id: 'WILD', name: 'GARUDA WILD', payout3x: 50, icon: '🦅', color: 'text-amber-400', bgColor: 'from-amber-600/30 to-yellow-500/20 border-amber-400' },
  RED_GEM: { id: 'RED_GEM', name: 'RED RUBY', payout3x: 30, icon: '🔴', color: 'text-red-400', bgColor: 'from-red-600/30 to-rose-500/20 border-red-500' },
  BLUE_GEM: { id: 'BLUE_GEM', name: 'BLUE SAPPHIRE', payout3x: 15, icon: '🔷', color: 'text-cyan-400', bgColor: 'from-blue-600/30 to-cyan-500/20 border-cyan-400' },
  GREEN_GEM: { id: 'GREEN_GEM', name: 'EMERALD GEM', payout3x: 8, icon: '🟢', color: 'text-emerald-400', bgColor: 'from-emerald-600/30 to-green-500/20 border-emerald-400' },
  A: { id: 'A', name: 'ACE GOLD', payout3x: 5, icon: '🅰️', color: 'text-purple-400', bgColor: 'from-purple-600/30 to-fuchsia-500/20 border-purple-400' },
  K: { id: 'K', name: 'KING CROWN', payout3x: 3, icon: '👑', color: 'text-yellow-300', bgColor: 'from-yellow-600/30 to-amber-500/20 border-yellow-400' },
};

export default function FortuneGemsGame({ balance, userId, onUpdateBalance, onClose }: FortuneGemsGameProps) {
  const [reels, setReels] = useState<string[]>(['RED_GEM', 'RED_GEM', 'RED_GEM']);
  const [fourthReel, setFourthReel] = useState<{ type: string; value: string | number }>({ type: 'MULTIPLIER', value: 1 });
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<number>(1);
  const [lastWin, setLastWin] = useState<number>(0);
  const [winMessage, setWinMessage] = useState<string>('');
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [jackpotPool, setJackpotPool] = useState<number>(589420);

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Jackpot ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotPool((prev) => prev + Math.floor(Math.random() * 25 + 5));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Auto spin watcher
  useEffect(() => {
    if (autoSpinCount > 0 && !isSpinning) {
      const timer = setTimeout(() => {
        handleSpin();
        setAutoSpinCount((c) => c - 1);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [autoSpinCount, isSpinning]);

  const handleSpin = async () => {
    if (isSpinning) return;
    if (balance <= 0) {
      sounds.playCrash();
      alert('আপনার ব্যালেন্স ৳০.০০! বাজি ধরার জন্য অনুগ্রহ করে ডিপোজিট করুন।');
      setAutoSpinCount(0);
      return;
    }

    // কম ব্যালেন্স থাকলেও কোনো ব্লক ছাড়া বাজি ধরা (অটো অ্যাডজাস্ট)
    const finalBet = getAffordableBet(balance, betAmount);
    if (finalBet === null) {
      alert('সঠিক বাজি নির্বাচন করুন');
      setAutoSpinCount(0);
      return;
    }

    sounds.playClick();
    setIsSpinning(true);
    setLastWin(0);
    setWinMessage('');

    // Deduct bet from balance
    const updatedBal = Math.max(0, balance - finalBet);
    onUpdateBalance(updatedBal, finalBet, 'BET', `Fortune Gems Bet: ৳${finalBet}`);

    // Fast reel shuffling animation
    const symbolKeys = Object.keys(FORTUNE_SYMBOLS);
    const multiplierValues = [1, 2, 3, 'WHEEL'];

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setReels([
        symbolKeys[Math.floor(Math.random() * symbolKeys.length)],
        symbolKeys[Math.floor(Math.random() * symbolKeys.length)],
        symbolKeys[Math.floor(Math.random() * symbolKeys.length)],
      ]);
      const randMul = multiplierValues[Math.floor(Math.random() * multiplierValues.length)];
      setFourthReel({
        type: randMul === 'WHEEL' ? 'LUCKY_WHEEL' : 'MULTIPLIER',
        value: randMul,
      });
      if (frame % 2 === 0) sounds.playSpinTick();
    }, 80);

    spinIntervalRef.current = interval;

    try {
      // Call Backend Spin API
      const res = await fetch(apiUrl('/api/game/fortune-gems/spin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, betAmount: finalBet }),
      });
      const data = await res.json();

      setTimeout(() => {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        setIsSpinning(false);

        if (data.success) {
          setReels(data.reels);
          setFourthReel(data.fourthReel);

          if (data.winAmount > 0) {
            sounds.playWin();
            setLastWin(data.winAmount);
            const isWheel = data.fourthReel.type === 'LUCKY_WHEEL';
            setWinMessage(isWheel ? '🎡 LUCKY WHEEL JACKPOT WIN!' : `✨ MEGA WIN x${data.fourthReel.value}!`);
            
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'],
            });

            onUpdateBalance(data.currentBalance, data.winAmount, 'WIN', `Fortune Gems Win: ৳${data.winAmount}`);
          } else {
            setWinMessage('পরের স্পিনে আবার চেষ্টা করুন!');
          }
        } else {
          // Fallback offline spin calculation
          setReels([symbolKeys[0], symbolKeys[1], 'GREEN_GEM']);
          setWinMessage('পরের স্পিনে আবার চেষ্টা করুন!');
        }
      }, 1200);
    } catch {
      setTimeout(() => {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        setIsSpinning(false);
        setReels([symbolKeys[0], symbolKeys[1], 'GREEN_GEM']);
        setWinMessage('পরের স্পিনে আবার চেষ্টা করুন!');
      }, 1200);
    }
  };

  return (
    <div className="bg-[#0b0e17] border-0 sm:border border-amber-500/40 rounded-none sm:rounded-2xl p-3 sm:p-5 w-full max-w-md mx-auto min-h-screen sm:min-h-0 sm:max-h-[96vh] flex flex-col justify-between shadow-2xl text-white relative overflow-hidden font-sans select-none">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-900/80 px-2.5 py-1.5 rounded-lg border border-gray-800 transition"
        >
          <ArrowLeft size={14} /> ফিরে যান
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 font-extrabold text-sm tracking-wider">
            <Gem size={16} className="text-amber-400 animate-pulse" />
            <span>FORTUNE GEMS</span>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40">4TH REEL</span>
          </div>
        </div>

        <button
          onClick={() => setShowPaytable(!showPaytable)}
          className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition"
        >
          <Info size={14} /> পে-টেবিল
        </button>
      </div>

      {/* Jackpot Grand Header */}
      <div className="my-3 bg-gradient-to-r from-amber-950/60 via-red-950/60 to-amber-950/60 border border-amber-500/30 rounded-xl p-2.5 text-center shadow-inner">
        <div className="text-[10px] tracking-widest text-amber-300 font-bold uppercase flex items-center justify-center gap-1">
          <Sparkles size={12} className="text-yellow-400" />
          GARUDA GRAND JACKPOT
          <Sparkles size={12} className="text-yellow-400" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 tracking-tight">
          ৳ {jackpotPool.toLocaleString('en-US')}
        </div>
      </div>

      {/* Main Reels Grid (3 Standard Reels + 1 Bonus Multiplier Reel) */}
      <div className="relative bg-[#06080e] border-2 border-amber-500/50 rounded-2xl p-3 sm:p-4 my-3 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {/* Reel 1 */}
          <div className={`h-24 sm:h-28 rounded-xl bg-gradient-to-b ${FORTUNE_SYMBOLS[reels[0]]?.bgColor || 'from-gray-900 to-black'} border flex flex-col items-center justify-center transition-all ${isSpinning ? 'blur-[1px] scale-95' : 'scale-100'}`}>
            <span className="text-3xl sm:text-4xl">{FORTUNE_SYMBOLS[reels[0]]?.icon || '💎'}</span>
            <span className={`text-[10px] font-black mt-1 ${FORTUNE_SYMBOLS[reels[0]]?.color || 'text-white'}`}>
              {FORTUNE_SYMBOLS[reels[0]]?.id || 'GEM'}
            </span>
          </div>

          {/* Reel 2 */}
          <div className={`h-24 sm:h-28 rounded-xl bg-gradient-to-b ${FORTUNE_SYMBOLS[reels[1]]?.bgColor || 'from-gray-900 to-black'} border flex flex-col items-center justify-center transition-all ${isSpinning ? 'blur-[1px] scale-95' : 'scale-100'}`}>
            <span className="text-3xl sm:text-4xl">{FORTUNE_SYMBOLS[reels[1]]?.icon || '💎'}</span>
            <span className={`text-[10px] font-black mt-1 ${FORTUNE_SYMBOLS[reels[1]]?.color || 'text-white'}`}>
              {FORTUNE_SYMBOLS[reels[1]]?.id || 'GEM'}
            </span>
          </div>

          {/* Reel 3 */}
          <div className={`h-24 sm:h-28 rounded-xl bg-gradient-to-b ${FORTUNE_SYMBOLS[reels[2]]?.bgColor || 'from-gray-900 to-black'} border flex flex-col items-center justify-center transition-all ${isSpinning ? 'blur-[1px] scale-95' : 'scale-100'}`}>
            <span className="text-3xl sm:text-4xl">{FORTUNE_SYMBOLS[reels[2]]?.icon || '💎'}</span>
            <span className={`text-[10px] font-black mt-1 ${FORTUNE_SYMBOLS[reels[2]]?.color || 'text-white'}`}>
              {FORTUNE_SYMBOLS[reels[2]]?.id || 'GEM'}
            </span>
          </div>

          {/* 4th BONUS MULTIPLIER REEL */}
          <div className={`h-24 sm:h-28 rounded-xl bg-gradient-to-b from-amber-600/40 via-yellow-500/20 to-amber-900/40 border-2 border-amber-400 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all ${isSpinning ? 'blur-[1px] scale-95' : 'scale-100'}`}>
            <div className="text-[9px] font-extrabold text-amber-300 uppercase tracking-wider mb-0.5">BONUS REEL</div>
            <span className="text-2xl sm:text-3xl">
              {fourthReel.type === 'LUCKY_WHEEL' ? '🎡' : '⚡'}
            </span>
            <span className="text-xs sm:text-sm font-black text-yellow-300 mt-0.5">
              {fourthReel.type === 'LUCKY_WHEEL' ? 'WHEEL' : `${fourthReel.value}X`}
            </span>
          </div>
        </div>

        {/* Win Alert Area */}
        <div className="mt-3 text-center min-h-[28px] flex items-center justify-center">
          {lastWin > 0 ? (
            <div className="text-emerald-400 font-extrabold text-sm sm:text-base animate-bounce flex items-center gap-1.5">
              <Award size={16} /> ৳{lastWin.toLocaleString()} জিতেছে! {winMessage}
            </div>
          ) : winMessage ? (
            <div className="text-gray-400 text-xs">{winMessage}</div>
          ) : (
            <div className="text-gray-500 text-xs">৩টি ম্যাচ ও ৪র্থ চাকায় বোনাস মাল্টিপ্লায়ার দিয়ে বড় জিতুন!</div>
          )}
        </div>
      </div>

      {/* Paytable Popout */}
      {showPaytable && (
        <div className="bg-gray-900/95 border border-gray-800 rounded-xl p-3 mb-3 text-xs">
          <div className="text-amber-400 font-bold mb-2 flex items-center gap-1">
            <Sparkles size={13} /> প্রতীক পে-আউট লিস্ট (৩x ম্যাচ):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(FORTUNE_SYMBOLS).map((sym) => (
              <div key={sym.id} className="bg-black/50 p-1.5 rounded border border-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-1">{sym.icon} {sym.id}</span>
                <span className="font-bold text-amber-400">{sym.payout3x}X</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-800 text-[11px] text-gray-400">
            * ৪র্থ চাকা মাল্টিপ্লায়ার (1x, 2x, 5x, 10x) অথবা লাকি হুইল (100x) সরাসরি মোট জিতে গুণ হবে।
          </div>
        </div>
      )}

      {/* Controls & Betting */}
      <div className="space-y-3">
        {/* Bet Selector: [1, 2, 5, 10, 20, 50] */}
        <div className="flex items-center justify-between bg-gray-900/70 p-2 rounded-xl border border-gray-800 gap-1 overflow-x-auto">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">বেট:</span>
          <div className="flex gap-1 flex-1 justify-end">
            {balance > 0 && balance < 10 && (
              <button
                disabled={isSpinning}
                onClick={() => setBetAmount(0.5)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition border ${
                  betAmount === 0.5
                    ? 'bg-amber-500 text-black border-amber-400 font-black'
                    : 'bg-gray-800 text-amber-300 border-amber-500/30 hover:bg-gray-700'
                }`}
              >
                ৳০.৫
              </button>
            )}
            {BET_PRESETS.map((amt) => (
              <button
                key={amt}
                disabled={isSpinning}
                onClick={() => setBetAmount(amt)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition border ${
                  betAmount === amt
                    ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md shadow-amber-500/20'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setAutoSpinCount(autoSpinCount > 0 ? 0 : 10)}
            disabled={isSpinning}
            className={`w-1/3 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              autoSpinCount > 0
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
            }`}
          >
            <RefreshCw size={14} className={autoSpinCount > 0 ? 'animate-spin' : ''} />
            {autoSpinCount > 0 ? `অটো (${autoSpinCount})` : 'অটো স্পিন'}
          </button>

          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-2/3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold py-3 rounded-xl text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
          >
            <Zap size={18} className="fill-black" />
            {isSpinning ? 'ঘুরছে...' : `স্পিন করুন (৳${betAmount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
