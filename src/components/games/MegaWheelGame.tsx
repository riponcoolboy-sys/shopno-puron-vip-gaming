import React, { useState } from 'react';
import { ArrowLeft, Sparkles, RotateCw, Volume2, ShieldCheck, Gift, Coins, Trophy, Zap, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { getRTPWheelSegmentIndex } from '../../utils/rtpManager';
import MegaWheelCanvas, { WHEEL_SEGMENTS, WheelSegmentConfig } from './MegaWheelCanvas';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface MegaWheelGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number, amountWonOrLost: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

export default function MegaWheelGame({ balance, onUpdateBalance, onClose }: MegaWheelGameProps) {
  const [betAmount, setBetAmount] = useState<number>(5);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [winningSegment, setWinningSegment] = useState<WheelSegmentConfig | null>(null);
  const [lastWin, setLastWin] = useState<number>(0);
  const [hostComment, setHostComment] = useState<string>('১৬ টি মেগা প্রাইজ স্লট! বাজি নির্ধারণ করে লাকি হুইল ঘোরান।');
  const [lastWinTime, setLastWinTime] = useState<number>(0);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
  const [freeSpinCelebration, setFreeSpinCelebration] = useState<boolean>(false);
  const [mysteryBoxOverlay, setMysteryBoxOverlay] = useState<{ show: boolean; prizeName: string; amount: number } | null>(null);


  // ১৬ টি স্লট ভিত্তিক র্যান্ডম ড্রপ এবং আকর্ষণীয় উইন রেশিও লজিক
  const selectTargetSegmentIndex = (isFree: boolean): number => {
    const now = Date.now();
    const isStreakLocked = now - lastWinTime < 25000;
    const rand = Math.random();

    // ফ্রি স্পিন চলাকালীন বেশি জয়ের চান্স
    if (isFree) {
      const freePicks = [0, 1, 2, 4, 7, 8, 9, 10, 12, 13, 14];
      return freePicks[Math.floor(Math.random() * freePicks.length)];
    }

    // ফ্রি স্পিন আনলক হওয়ার চান্স (১৫%)
    if (rand < 0.15) {
      return Math.random() < 0.5 ? 0 : 8; // FREE SPIN slots
    }

    // মিস্ট্রি বক্স চান্স (১০%)
    if (rand < 0.25) {
      return 13; // Mystery Box
    }

    // অন্যান্য ক্যাশ ও মাল্টিপ্লায়ার উইন (৪০%)
    if (rand < 0.65) {
      const winOptions = [1, 2, 4, 5, 7, 9, 10, 12, 14]; // 5tk, 2x, 20tk, 3x, 50tk, 10tk, 5x, 15tk, 100tk
      return winOptions[Math.floor(Math.random() * winOptions.length)];
    }

    // লস / ট্রাই এগেইন স্লটস (৩৫%)
    const lossOptions = [3, 6, 11, 15]; // 0tk, Try Again, 0tk, Try Again
    return lossOptions[Math.floor(Math.random() * lossOptions.length)];
  };

  const handleSpin = () => {
    if (isSpinning) return;

    const isUsingFreeSpin = freeSpinsRemaining > 0;

    if (!isUsingFreeSpin && balance <= 0) {
      alert('আপনার ব্যালেন্স ৳০.০০! বাজি ধরার জন্য অনুগ্রহ করে ডিপোজিট করুন।');
      return;
    }

    // ব্যালেন্স অনুযায়ী স্বয়ংক্রিয় বেট নির্ধারণ
    let finalBet = isUsingFreeSpin ? 0 : betAmount;
    if (!isUsingFreeSpin && finalBet > balance) {
      const affordableBet = getAffordableBet(balance, betAmount);
      if (affordableBet === null) return;
      finalBet = affordableBet;
      setBetAmount(affordableBet);
    }

    if (!isUsingFreeSpin && finalBet <= 0) {
      alert('সঠিক বাজি নির্বাচন করুন');
      return;
    }

    sounds.playClick();

    // ফ্রি স্পিন হলে ব্যালেন্স কাটা হবে না, পেইড স্পিন হলে কাটা হবে
    const balanceAfterBet = isUsingFreeSpin ? balance : Math.max(0, balance - finalBet);
    if (!isUsingFreeSpin) {
      onUpdateBalance(balanceAfterBet, finalBet, 'BET', `Wheel Spin বাজি ৳${finalBet}`);
    } else {
      setFreeSpinsRemaining((prev) => Math.max(0, prev - 1));
    }

    setIsSpinning(true);
    setWinningSegment(null);
    setLastWin(0);
    setFreeSpinCelebration(false);
    setMysteryBoxOverlay(null);
    setHostComment(isUsingFreeSpin ? '🎁 ফ্রি স্পিন চলছে (৳০ খরচ)! দেখা যাক কী আকর্ষণীয় পুরস্কার মেলে!' : '১৬-স্লট মেগা হুইল ঘুরছে... দেখা যাক কী পুরস্কার মেলে!');

    // ১৬ টি স্লট থেকে ৯২%-৯৪% RTP ভিত্তিক টার্গেট ইনডেক্স নির্বাচন
    const targetIdx = getRTPWheelSegmentIndex(isUsingFreeSpin);
    const chosenSegment = WHEEL_SEGMENTS[targetIdx];

    // টপ পয়েন্টারের জন্য ১৬-স্লট কোণ ক্যালকুলেশন (Angle per segment = 22.5°, Pointer at 270°)
    const extraTurns = 6 + Math.floor(Math.random() * 2); // 6-7 full turns
    const segmentCenterAngle = targetIdx * 22.5 + 11.25;
    const alignAngle = (270 - segmentCenterAngle + 360) % 360;

    const currentBase = Math.floor(wheelRotation / 360) * 360;
    const newTargetRotation = currentBase + 360 * extraTurns + alignAngle;

    setWheelRotation(newTargetRotation);

    // টিক সাউন্ড এফেক্ট
    let tickCount = 0;
    const tickTimer = setInterval(() => {
      tickCount++;
      sounds.playSpinTick();
      if (tickCount > 38) clearInterval(tickTimer);
    }, 100);

    setTimeout(() => {
      setIsSpinning(false);
      setWinningSegment(chosenSegment);

      // ১. ফ্রি স্পিন স্লট (FREE SPIN)
      if (chosenSegment.type === 'FREE_SPIN') {
        setFreeSpinsRemaining((prev) => prev + 1);
        setFreeSpinCelebration(true);
        setHostComment('🎉 অভিনন্দন! আপনি ১টি ফ্রি স্পিন জিতেছেন! পরবর্তী স্পিন খরচ হবে ৳০ BDT!');
        sounds.playCashout();
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      }

      // ২. মিস্ট্রি বক্স স্লট (MYSTERY BOX)
      else if (chosenSegment.type === 'MYSTERY') {
        const mysteryPrizes = [
          { name: 'গোল্ডেন ট্রেজার', amount: 35 },
          { name: 'রয়্যাল বোনাস', amount: 50 },
          { name: 'মেগা ডায়মন্ড বক্স', amount: 75 },
          { name: 'জ্যাকপট ক্যাশ', amount: 150 },
        ];
        const randomMystery = mysteryPrizes[Math.floor(Math.random() * mysteryPrizes.length)];
        const wonAmount = randomMystery.amount;
        const finalBalance = balanceAfterBet + wonAmount;

        setMysteryBoxOverlay({ show: true, prizeName: randomMystery.name, amount: wonAmount });
        setLastWin(wonAmount);
        setLastWinTime(Date.now());
        setHostComment(`📦 মিস্ট্রি বক্স আনলক! আপনি পেয়েছেন ${randomMystery.name} (৳${wonAmount} BDT)!`);
        sounds.playBigWin();
        confetti({ particleCount: 100, spread: 85, origin: { y: 0.55 } });
        onUpdateBalance(finalBalance, wonAmount, 'WIN', `Wheel Spin মিস্ট্রি বক্স (${randomMystery.name}) ৳${wonAmount}`);
      }

      // ৩. ট্রাই এগেইন (TRY AGAIN)
      else if (chosenSegment.type === 'TRY_AGAIN') {
        if (!isUsingFreeSpin) {
          const restoredBalance = balanceAfterBet + finalBet;
          setLastWin(0);
          setHostComment('Try Again! ভাগ্য সহায় হয়নি, বাজি রিফান্ড হয়েছে। আবার চেষ্টা করুন!');
          onUpdateBalance(restoredBalance, 0, 'WIN', `Wheel Spin: Try Again (রিফান্ড ৳${finalBet})`);
        } else {
          setHostComment('Try Again! ভাগ্য সহায় হয়নি। আবার স্পিন করুন!');
        }
      }

      // ৪. ০ টাকা (ZERO)
      else if (chosenSegment.type === 'ZERO') {
        setLastWin(0);
        setHostComment('০ টাকা! এই রাউন্ডে রিওয়ার্ড মেলেনি। পরবর্তী রাউন্ডে শুভকামনা!');
      }

      // ৫. মাল্টিপ্লায়ার (2X, 3X, 5X)
      else if (chosenSegment.type === 'MULTIPLIER') {
        const base = isUsingFreeSpin ? Math.max(10, betAmount) : finalBet;
        const mult = chosenSegment.value;
        const wonAmount = Math.floor(base * mult);
        const finalBalance = balanceAfterBet + wonAmount;

        setLastWin(wonAmount);
        setLastWinTime(Date.now());
        setHostComment(`অভিনন্দন! আপনি ${chosenSegment.label} মাল্টিপ্লায়ারে জিতেছেন ৳${wonAmount.toLocaleString()}!`);
        sounds.playBigWin();
        confetti({ particleCount: 85, spread: 75, origin: { y: 0.6 } });
        onUpdateBalance(finalBalance, wonAmount, 'WIN', `Wheel Spin জয় (${chosenSegment.label}) ৳${wonAmount}`);
      }

      // ৬. ফিক্সড ক্যাশ রিওয়ার্ডস (5tk, 10tk, 15tk, 20tk, 50tk, 100tk)
      else if (chosenSegment.type === 'CASH') {
        const cashWon = chosenSegment.value;
        const finalBalance = balanceAfterBet + cashWon;

        setLastWin(cashWon);
        setLastWinTime(Date.now());
        setHostComment(`অভিনন্দন! আপনি সরাসরি ৳${cashWon} ক্যাশ রিওয়ার্ড জিতেছেন!`);
        sounds.playBigWin();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        onUpdateBalance(finalBalance, cashWon, 'WIN', `Wheel Spin ক্যাশ জয় ৳${cashWon}`);
      }
    }, 4200);
  };

  // View mode for the 16-slot prizes: horizontal strip or 4-col micro-grid
  const [prizeViewMode, setPrizeViewMode] = useState<'strip' | 'grid'>('strip');

  return (
    <div className="bg-[#090b14] text-white w-full max-w-md mx-auto min-h-screen sm:min-h-0 sm:max-h-[96vh] flex flex-col justify-between rounded-none sm:rounded-3xl overflow-hidden border-0 sm:border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.25)] relative select-none">
      {/* 1. Top Bar */}
      <div className="bg-gradient-to-r from-[#17142a] via-[#1f1a3a] to-[#17142a] border-b border-amber-500/30 px-3.5 py-2 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-1.5 rounded-lg bg-gray-800/90 hover:bg-gray-700 text-gray-300 transition cursor-pointer border border-gray-700 active:scale-95"
            title="লবিতে ফিরে যান"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-black text-sm sm:text-base italic tracking-wide">MEGA WHEEL</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded-full border border-amber-500/40">
              16 SLOTS
            </span>
          </div>
        </div>

        {/* User Balance & Free Spin Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {freeSpinsRemaining > 0 && (
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.7)] animate-pulse border border-yellow-200">
              <Gift size={11} />
              <span>{freeSpinsRemaining} FREE</span>
            </div>
          )}
          <div className="bg-black/60 border border-amber-500/40 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-inner">
            <span className="text-[9px] text-amber-300/90 font-bold">ব্যালেন্স:</span>
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">৳{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 2. Host Commentator Bar */}
      <div className="bg-gradient-to-r from-amber-950/60 via-purple-950/70 to-indigo-950/60 px-3.5 py-1.5 border-b border-amber-500/20 flex items-center justify-between gap-2 shadow-sm shrink-0">
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center text-xs shrink-0 shadow">
            👩‍💼
          </div>
          <div className="text-xs truncate">
            <span className="font-bold text-amber-300">হোস্ট সোফিয়া: </span>
            <span className="text-gray-200">{hostComment}</span>
          </div>
        </div>
        <div className="text-[9px] font-mono font-bold text-amber-400 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
          RTP 98.2%
        </div>
      </div>

      {/* 3. Wheel Visual Stage (Proportional Auto-Scaling Canvas with Aspect-Square) */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden py-2 px-3 bg-gradient-to-b from-[#110e24] via-[#1a1438] to-[#0a0c16] min-h-0">
        {/* Render 16-Segment Gold Wheel Canvas (w-full max-w-[280px] aspect-square mx-auto) */}
        <MegaWheelCanvas rotationAngle={wheelRotation} />

        {/* Win announcement floating pill */}
        {winningSegment && !isSpinning && (
          <div className="absolute bottom-2 bg-black/90 border border-amber-400 px-4 py-1.5 rounded-full text-xs text-center backdrop-blur-md z-20 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-bounce max-w-[90%] truncate">
            {winningSegment.type === 'FREE_SPIN' ? (
              <span className="text-yellow-300 font-black flex items-center justify-center gap-1">
                <Gift size={14} /> FREE SPIN আনলক! পরবর্তী স্পিন বিনামূল্যে (৳০)!
              </span>
            ) : winningSegment.type === 'MYSTERY' ? (
              <span className="text-pink-300 font-black flex items-center justify-center gap-1">
                <Gift size={14} /> 📦 মিস্ট্রি পুরষ্কার: +৳{lastWin.toLocaleString()} BDT!
              </span>
            ) : winningSegment.type === 'TRY_AGAIN' ? (
              <span className="text-amber-300 font-bold">🔄 Try Again! বাজি রিফান্ড হয়েছে</span>
            ) : winningSegment.type === 'ZERO' ? (
              <span className="text-red-400 font-bold">❌ 0 TK - পরবর্তী রাউন্ডে শুভকামনা</span>
            ) : (
              <span className="text-emerald-400 font-black flex items-center justify-center gap-1">
                <Trophy size={14} /> বিজয়ী: {winningSegment.label}! (+৳{lastWin.toLocaleString()} BDT)
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Dynamic 16-Slot Prize Grid / Horizontal Strip */}
      <div className="bg-[#0f0c1e] px-3 py-1.5 border-t border-gray-800/80 shrink-0">
        <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold uppercase mb-1">
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>১৬টি প্রাইজ স্লট:</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPrizeViewMode(prizeViewMode === 'strip' ? 'grid' : 'strip')}
              className="text-[9px] text-amber-400 hover:text-yellow-300 underline font-mono cursor-pointer"
            >
              {prizeViewMode === 'strip' ? '4-কলাম গ্রিড দেখুন' : 'স্ক্রোল বার দেখুন'}
            </button>
            <span className="text-gray-500 font-mono hidden xs:inline">• 16 SLOTS</span>
          </div>
        </div>

        {prizeViewMode === 'strip' ? (
          /* Option A: Horizontal Scrolling Bar with Compact Chips */
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {WHEEL_SEGMENTS.map((seg, idx) => {
              const isWinning = winningSegment?.id === seg.id && !isSpinning;
              const isFree = seg.type === 'FREE_SPIN';
              const isMystery = seg.type === 'MYSTERY';

              return (
                <div
                  key={idx}
                  className={`h-6.5 px-2.5 rounded-lg text-center font-black text-[9.5px] border shrink-0 transition flex items-center justify-center gap-1 whitespace-nowrap ${
                    isWinning
                      ? 'border-yellow-300 bg-amber-500/40 text-white shadow-[0_0_10px_rgba(245,158,11,0.8)] scale-105 z-10'
                      : isFree
                      ? 'border-amber-500/70 bg-amber-950/40 text-amber-300'
                      : isMystery
                      ? 'border-pink-500/70 bg-pink-950/40 text-pink-300'
                      : 'border-gray-800/90 bg-[#080912] text-gray-300'
                  }`}
                >
                  <span className="text-[10px]">{seg.icon || '🎯'}</span>
                  <span>{seg.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Option B: Dynamic 4-Column Compact Micro-Grid */
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 max-h-[85px] overflow-y-auto no-scrollbar py-0.5">
            {WHEEL_SEGMENTS.map((seg, idx) => {
              const isWinning = winningSegment?.id === seg.id && !isSpinning;
              const isFree = seg.type === 'FREE_SPIN';
              const isMystery = seg.type === 'MYSTERY';

              return (
                <div
                  key={idx}
                  className={`h-6 px-1 rounded-md text-center font-black text-[8.5px] sm:text-[9px] border transition flex items-center justify-center gap-0.5 truncate ${
                    isWinning
                      ? 'border-yellow-300 bg-amber-500/40 text-white shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-105 z-10'
                      : isFree
                      ? 'border-amber-500/70 bg-amber-950/40 text-amber-300'
                      : isMystery
                      ? 'border-pink-500/70 bg-pink-950/40 text-pink-300'
                      : 'border-gray-800/90 bg-[#080912] text-gray-300'
                  }`}
                >
                  <span className="text-[9px]">{seg.icon || '🎯'}</span>
                  <span className="truncate">{seg.shortLabel || seg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Standard Bottom Control Panel (p-3 with proper scaling) */}
      <div className="bg-[#141029] p-3 border-t border-gray-800 space-y-2 shrink-0">
        {/* Quick Bet Presets Row */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {BET_PRESETS.map((amt) => (
            <button
              key={amt}
              disabled={isSpinning || freeSpinsRemaining > 0}
              onClick={() => { sounds.playClick(); setBetAmount(amt); }}
              className={`flex-1 min-w-[36px] py-1.5 rounded-lg text-xs font-black font-mono transition border cursor-pointer active:scale-95 ${
                freeSpinsRemaining > 0
                  ? 'opacity-40 bg-gray-900 text-gray-500 border-gray-800'
                  : betAmount === amt
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-200 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'bg-gray-900/90 text-gray-300 border-gray-700/60 hover:bg-gray-800 hover:text-white'
              }`}
            >
              ৳{amt}
            </button>
          ))}
        </div>

        {/* Stepper + Big Spin Button Row */}
        <div className="grid grid-cols-12 gap-2">
          {/* Bet Stepper / Free Spin Indicator */}
          <div className="col-span-5 bg-[#0a0c16] border border-gray-800 rounded-xl p-1.5 flex flex-col justify-between shadow-inner h-12">
            <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase leading-none">
              <span>{freeSpinsRemaining > 0 ? 'ফ্রি স্পিন' : 'বাজি'}</span>
              <span className="text-amber-400 font-mono font-black">
                {freeSpinsRemaining > 0 ? '৳০' : `৳${betAmount}`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 leading-none mt-0.5">
              <button
                disabled={isSpinning || freeSpinsRemaining > 0}
                onClick={() => {
                  sounds.playClick();
                  setBetAmount((prev) => {
                    if (prev <= 1) return 1;
                    if (prev <= 2) return 1;
                    if (prev <= 5) return 2;
                    if (prev <= 10) return 5;
                    if (prev <= 20) return 10;
                    if (prev <= 50) return 20;
                    return Math.max(1, prev - 20);
                  });
                }}
                className="w-7 h-6 bg-gray-800 hover:bg-gray-700 rounded-md text-xs font-black text-gray-200 transition flex items-center justify-center disabled:opacity-30 cursor-pointer active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                disabled={isSpinning || freeSpinsRemaining > 0}
                value={freeSpinsRemaining > 0 ? 0 : betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent text-center font-mono font-black text-amber-300 text-xs sm:text-sm focus:outline-none disabled:text-emerald-400 p-0"
              />
              <button
                disabled={isSpinning || freeSpinsRemaining > 0}
                onClick={() => {
                  sounds.playClick();
                  setBetAmount((prev) => {
                    if (prev < 2) return 2;
                    if (prev < 5) return 5;
                    if (prev < 10) return 10;
                    if (prev < 20) return 20;
                    if (prev < 50) return 50;
                    if (prev < 100) return 100;
                    return prev + 20;
                  });
                }}
                className="w-7 h-6 bg-gray-800 hover:bg-gray-700 rounded-md text-xs font-black text-gray-200 transition flex items-center justify-center disabled:opacity-30 cursor-pointer active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Spin Trigger Button */}
          <div className="col-span-7">
            <button
              disabled={isSpinning}
              onClick={handleSpin}
              className={`w-full h-12 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center transition-all duration-200 border cursor-pointer active:scale-98 relative overflow-hidden gap-1.5 shadow-lg ${
                isSpinning
                  ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  : freeSpinsRemaining > 0
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 text-black border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.7)] animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-black border-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
              }`}
            >
              {freeSpinsRemaining > 0 ? (
                <>
                  <Gift size={16} />
                  <span>FREE SPIN ({freeSpinsRemaining}টি বাকি)</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{isSpinning ? 'ঘুরছে...' : `SPIN (৳${betAmount})`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 6. Free Spin Celebration Popup Modal */}
      {freeSpinCelebration && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-xs bg-gradient-to-b from-amber-950 via-[#15122a] to-black border-2 border-yellow-300 rounded-3xl p-5 text-center space-y-3 shadow-[0_0_50px_rgba(255,215,0,0.7)]">
            <div className="text-5xl animate-bounce">🎁</div>
            <h3 className="text-lg font-black text-yellow-300 tracking-wider">
              FREE SPIN UNLOCKED!
            </h3>
            <p className="text-xs text-gray-200">
              অভিনন্দন! আপনি <span className="text-emerald-400 font-bold">১টি ফ্রি স্পিন</span> জিতেছেন। পরবর্তী স্পিনের জন্য কোনো ব্যালেন্স কাটা হবে না (৳০ BDT)!
            </p>
            <div className="bg-black/60 border border-yellow-400/50 rounded-2xl py-2 px-3">
              <span className="text-xs font-black font-mono text-emerald-400">
                পরবর্তী স্পিন খরচ: ৳০.০০ BDT
              </span>
            </div>
            <button
              onClick={() => setFreeSpinCelebration(false)}
              className="w-full bg-gradient-to-r from-[#FFC700] to-yellow-400 text-black font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer hover:brightness-110"
            >
              এখনই ফ্রি স্পিন করুন!
            </button>
          </div>
        </div>
      )}

      {/* 7. Mystery Box Popup Modal */}
      {mysteryBoxOverlay?.show && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-xs bg-gradient-to-b from-purple-950 via-[#18112e] to-black border-2 border-pink-400 rounded-3xl p-5 text-center space-y-3 shadow-[0_0_50px_rgba(236,72,153,0.7)]">
            <div className="text-5xl animate-bounce">📦</div>
            <h3 className="text-lg font-black text-pink-300 tracking-wider">
              MYSTERY BOX UNLOCKED!
            </h3>
            <p className="text-xs text-gray-200">
              আপনি বক্স থেকে পেয়েছেন <strong className="text-yellow-300">{mysteryBoxOverlay.prizeName}</strong>!
            </p>
            <div className="bg-black/70 border border-pink-500/60 rounded-2xl py-3 px-4 shadow-inner">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">পুরষ্কারের পরিমাণ</span>
              <p className="text-2xl font-black font-mono text-emerald-400">
                +৳{mysteryBoxOverlay.amount.toLocaleString()} BDT
              </p>
            </div>
            <button
              onClick={() => setMysteryBoxOverlay(null)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer hover:brightness-110"
            >
              পুরষ্কার গ্রহণ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



