import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, AlertCircle, ShieldAlert, Sparkles, CheckCircle2, TrendingUp, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { calculateCrashPoint, recordPlayerRoundOutcome } from '../../utils/gameEngine';
import { realtimeSync } from '../../utils/realtimeSync';
import SpribeAviatorPlane from './SpribeAviatorPlane';
import { BET_PRESETS, getAffordableBet } from '../../utils/betPresets';

interface AviatorGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number, amountWonOrLost: number, type: 'BET' | 'WIN', description: string) => void;
  onClose: () => void;
}

type GamePhase = 'IDLE' | 'STARTING' | 'FLYING' | 'CRASHED';

interface PastRound {
  multiplier: number;
  crashedAt: string;
}

export default function AviatorGame({ balance, onUpdateBalance, onClose }: AviatorGameProps) {
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [countdown, setCountdown] = useState<number>(5);
  const [betAmount, setBetAmount] = useState<number>(1);
  const [hasActiveBet, setHasActiveBet] = useState<boolean>(false);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(false);
  const [autoCashoutTarget, setAutoCashoutTarget] = useState<number>(2.0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [history, setHistory] = useState<PastRound[]>([
    { multiplier: 2.14, crashedAt: '12:01' },
    { multiplier: 1.35, crashedAt: '12:02' },
    { multiplier: 8.42, crashedAt: '12:03' },
    { multiplier: 1.12, crashedAt: '12:04' },
    { multiplier: 3.80, crashedAt: '12:05' },
    { multiplier: 19.50, crashedAt: '12:06' },
  ]);

  const [fakeBets, setFakeBets] = useState([
    { user: 'Sabbir***', bet: 20, status: 'playing', cashout: 0 },
    { user: 'VIP_Boss88', bet: 50, status: 'playing', cashout: 0 },
    { user: 'Hasan_Dhaka', bet: 5, status: 'playing', cashout: 0 },
    { user: 'Rony_Chit', bet: 10, status: 'playing', cashout: 0 },
  ]);

  const animationFrameRef = useRef<number | null>(null);
  const crashPointRef = useRef<number>(2.0);
  const startTimeRef = useRef<number>(0);

  // Quick Bet presets: [১, ২, ৫, ১০, ২০, ৫০] টাকা
  // Auto-start round cycle
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'IDLE') {
      setPhase('STARTING');
      setCountdown(4);
    } else if (phase === 'STARTING') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            startFlight();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase]);

  const startFlight = () => {
    // Calculate total bets in current round (user bet + online player bets)
    const activePlayerBets = [
      Math.floor(Math.random() * 400 + 50),
      Math.floor(Math.random() * 1500 + 500),
      Math.floor(Math.random() * 200 + 30),
      Math.floor(Math.random() * 800 + 100),
    ];
    const totalBetsInRound = activePlayerBets.reduce((a, b) => a + b, 0) + (hasActiveBet ? betAmount : 0);

    // 70%-80% House Margin Intermittent Reward Crash Point Engine Calculation
    const calculatedCrash = calculateCrashPoint(totalBetsInRound, hasActiveBet, betAmount);

    crashPointRef.current = calculatedCrash;
    startTimeRef.current = performance.now();
    setMultiplier(1.00);
    setPhase('FLYING');
    setHasCashedOut(false);
    setWinAmount(0);

    // Reset fake bets
    setFakeBets([
      { user: 'Sabbir***', bet: activePlayerBets[0], status: 'playing', cashout: 0 },
      { user: 'VIP_Boss88', bet: activePlayerBets[1], status: 'playing', cashout: 0 },
      { user: 'Hasan_BD', bet: activePlayerBets[2], status: 'playing', cashout: 0 },
      { user: 'Rony_King', bet: activePlayerBets[3], status: 'playing', cashout: 0 },
    ]);

    const runFlightLoop = (currentTime: number) => {
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      // Exponential curve: multiplier = e^(0.07 * elapsed^1.15)
      const currentMult = Math.max(1.00, Math.pow(Math.E, 0.12 * Math.pow(elapsed, 1.18)));
      const formattedMult = parseFloat(currentMult.toFixed(2));

      if (formattedMult >= crashPointRef.current) {
        // Crashed!
        setMultiplier(crashPointRef.current);
        setPhase('CRASHED');
        sounds.playCrash();

        // Update history
        setHistory((prev) => [
          { multiplier: crashPointRef.current, crashedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev.slice(0, 11),
        ]);

        // If player had active bet and hadn't cashed out, they lose
        if (hasActiveBet && !hasCashedOut) {
          recordPlayerRoundOutcome(false, betAmount, 0);
          setHasActiveBet(false);
        }

        // Restart cycle in 3.5 seconds
        setTimeout(() => {
          setPhase('IDLE');
        }, 3500);
        return;
      }

      setMultiplier(formattedMult);

      // Check Auto-Cashout
      if (hasActiveBet && !hasCashedOut && autoCashoutEnabled && formattedMult >= autoCashoutTarget) {
        executeCashout(formattedMult);
      }

      // Randomly simulate other players cashing out
      if (Math.random() < 0.08) {
        setFakeBets((prev) =>
          prev.map((fb) => {
            if (fb.status === 'playing' && Math.random() < 0.25) {
              return { ...fb, status: 'cashed', cashout: formattedMult };
            }
            return fb;
          })
        );
      }

      animationFrameRef.current = requestAnimationFrame(runFlightLoop);
    };

    animationFrameRef.current = requestAnimationFrame(runFlightLoop);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handlePlaceBet = () => {
    sounds.playClick();
    if (balance <= 0) {
      setErrorMessage('ব্যালেন্স ৳০.০০! বাজি ধরার জন্য অনুগ্রহ করে ডিপোজিট করুন');
      return;
    }

    // কম ব্যালেন্স থাকলেও যাতে কোনো ব্লক ছাড়া বাজি ধরা যায় (অটো অ্যাডজাস্ট)
    const finalBet = getAffordableBet(balance, betAmount);
    if (finalBet === null) {
      setErrorMessage('সঠিক বাজি নির্বাচন করুন');
      return;
    }

    setErrorMessage('');
    const newBal = Math.max(0, balance - finalBet);
    onUpdateBalance(newBal, finalBet, 'BET', `Aviator 2.0 বাজি ৳${finalBet}`);
    setHasActiveBet(true);
    setHasCashedOut(false);
  };

  const handleCancelBet = () => {
    if (phase === 'STARTING' && hasActiveBet) {
      sounds.playClick();
      onUpdateBalance(balance + betAmount, betAmount, 'WIN', `Aviator বাজি বাতিল ৳${betAmount}`);
      setHasActiveBet(false);
    }
  };

  const handleCashout = async (multi: number) => {
    if (!hasActiveBet || hasCashedOut || phase !== 'FLYING') return;

    // Multiplier max cap up to 6.0x based on Intermittent Big Win Algorithm
    const effectiveMulti = Math.min(6.0, Math.max(1.0, Number(multi) || 1.0));
    const rawWin = Math.floor(betAmount * effectiveMulti);
    const winAmountVal = Math.min(rawWin, Math.floor(betAmount * 6.0));
    const updatedBalance = balance + winAmountVal;

    // ১. স্ক্রিনে সাথে সাথে বাড়ানো
    sounds.playCashout();
    setWinAmount(winAmountVal);
    setHasCashedOut(true);
    setHasActiveBet(false);

    // ২. Intermittent Reward Engine-এ জয় রেজিস্টার করা (পরপর ২ জয়ে ড্রেন মোড ট্রিগার)
    recordPlayerRoundOutcome(true, betAmount, winAmountVal);

    onUpdateBalance(updatedBalance, winAmountVal, 'WIN', `Aviator জয় ৳${winAmountVal} (${effectiveMulti}x)`);

    // ৩. WebSocket ও REST Fallback দিয়ে রিয়েল-টাইমে ডাটাবেজে ব্যালেন্স সিঙ্ক করা
    realtimeSync.syncBalanceUpdate(
      updatedBalance,
      winAmountVal,
      'WIN',
      `Aviator Cashout ৳${winAmountVal} (${effectiveMulti}x)`
    );

    if (effectiveMulti >= 2.0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const executeCashout = (currentMult: number) => {
    handleCashout(currentMult);
  };

  const planeProgressX = Math.min(85, 10 + (multiplier - 1) * 18);
  const planeProgressY = Math.min(75, 15 + (multiplier - 1) * 14);

  return (
    <div className="bg-[#0a0c14] text-white w-full max-w-md mx-auto min-h-screen sm:min-h-0 sm:max-h-[96vh] flex flex-col justify-between rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-red-500/30 shadow-2xl relative select-none">
      {/* Top Bar */}
      <div className="bg-[#121524] border-b border-gray-800 px-3.5 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-red-500 font-black text-base sm:text-lg italic tracking-wider">AVIATOR</span>
            <span className="text-[9px] bg-red-600/20 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/30">2.0 SPRIBE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-black/40 border border-amber-500/40 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="text-[9px] text-amber-400 font-bold">ব্যালেন্স:</span>
            <span className="text-xs sm:text-sm font-black text-amber-300">৳{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Multiplier History Bar */}
      <div className="bg-[#0d101d] px-3 py-1 border-b border-gray-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[9px] text-gray-500 font-bold uppercase whitespace-nowrap">পূর্ববর্তী:</span>
        {history.map((h, i) => (
          <span
            key={i}
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
              h.multiplier >= 10
                ? 'bg-purple-900/60 text-purple-300 border-purple-500/50'
                : h.multiplier >= 2.0
                ? 'bg-blue-900/60 text-blue-300 border-blue-500/50'
                : 'bg-red-950/60 text-red-300 border-red-800/50'
            }`}
          >
            {h.multiplier.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Flight Arena Area (Proportionally Scaled Main Canvas) */}
      <div className="flex-1 min-h-0 bg-gradient-to-b from-[#090b16] via-[#101426] to-[#0a0d1c] relative flex flex-col items-center justify-center overflow-hidden border-b border-gray-800 py-3 px-2">
        {/* Curved Flight Grid Lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Phase States */}
        {phase === 'STARTING' && (
          <div className="flex flex-col items-center z-10 animate-pulse">
            <div className="w-14 h-14 rounded-full border-4 border-red-500/40 border-t-red-500 animate-spin flex items-center justify-center mb-2">
              <span className="text-lg font-black text-red-400 font-mono">{countdown}</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-300 tracking-wide">পরবর্তী রাউন্ড শুরু হচ্ছে...</p>
            <p className="text-[10px] text-red-400/80 mt-0.5 font-mono">বাজি ধরার সময় এখনই</p>
          </div>
        )}

        {phase === 'FLYING' && (
          <div className="z-10 flex flex-col items-center">
            <span className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse">
              {multiplier.toFixed(2)}<span className="text-3xl sm:text-4xl text-red-400">x</span>
            </span>
            {hasActiveBet && !hasCashedOut && (
              <div className="mt-2 bg-black/60 border border-emerald-500/50 px-3 py-1 rounded-full text-xs text-emerald-400 font-mono flex items-center gap-1.5 animate-bounce">
                <Sparkles size={13} /> সম্ভাব্য জয়: ৳{Math.floor(betAmount * multiplier).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {phase === 'CRASHED' && (
          <div className="z-10 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold bg-red-950/80 border border-red-600/50 px-3 py-0.5 rounded-full mb-1.5">
              FLEW AWAY! বিমানটি চলে গেছে
            </span>
            <span className="text-4xl sm:text-5xl font-black font-mono text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
              {multiplier.toFixed(2)}x
            </span>
          </div>
        )}

        {/* Animated Flight Graphic - 3D Metallic Red Spribe Sports Jet */}
        {phase === 'FLYING' && (
          <SpribeAviatorPlane
            x={`${planeProgressX}%`}
            y={`${100 - planeProgressY}%`}
          />
        )}

        {/* Win Overlay Notification */}
        {hasCashedOut && (
          <div className="absolute top-4 bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-4 py-2 rounded-xl text-center shadow-lg backdrop-blur-sm z-20 animate-in fade-in zoom-in duration-200">
            <p className="text-xs font-bold">অভিনন্দন! আপনি জিতেছেন</p>
            <p className="text-lg font-black text-emerald-400 font-mono">৳{winAmount.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Standard Bet Control Panel (p-3 with proper scaling) */}
      <div className="bg-[#121524] p-3 space-y-2 shrink-0">
        {errorMessage && (
          <div className="bg-red-950/70 border border-red-700 text-red-300 text-xs px-3 py-1 rounded-lg flex items-center gap-1.5">
            <ShieldAlert size={13} /> {errorMessage}
          </div>
        )}

        {/* Quick Bet Buttons */}
        <div className="flex items-center justify-between gap-1">
          {balance > 0 && balance < 10 && (
            <button
              type="button"
              disabled={hasActiveBet && phase === 'FLYING'}
              onClick={() => { sounds.playClick(); setBetAmount(0.5); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition border cursor-pointer active:scale-95 ${
                betAmount === 0.5
                  ? 'bg-amber-500/30 text-amber-300 border-amber-500'
                  : 'bg-[#0a0c16] text-amber-400 border-amber-500/30 hover:text-white'
              }`}
            >
              ৳০.৫
            </button>
          )}
          {BET_PRESETS.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={hasActiveBet && phase === 'FLYING'}
              onClick={() => { sounds.playClick(); setBetAmount(amt); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition border cursor-pointer active:scale-95 ${
                betAmount === amt
                  ? 'bg-red-600/30 text-red-300 border-red-500'
                  : 'bg-[#0a0c16] text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              ৳{amt}
            </button>
          ))}
        </div>

        {/* Main Bet Controls Grid */}
        <div className="grid grid-cols-12 gap-2">
          {/* Bet Input Section */}
          <div className="col-span-5 bg-[#0a0c16] border border-gray-800 rounded-xl p-1.5 flex flex-col justify-between h-12">
            <span className="text-[9px] text-gray-400 uppercase font-bold leading-none">বাজির পরিমাণ</span>
            <div className="flex items-center gap-1 mt-0.5">
              <button
                disabled={hasActiveBet && phase === 'FLYING'}
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
                className="w-7 h-6 bg-gray-800 rounded text-xs font-bold text-gray-300 hover:bg-gray-700 flex items-center justify-center cursor-pointer active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                disabled={hasActiveBet && phase === 'FLYING'}
                value={betAmount}
                onChange={(e) => setBetAmount(BET_PRESETS.includes(Number(e.target.value) as typeof BET_PRESETS[number]) ? Number(e.target.value) : 1)}
                className="w-full bg-transparent text-center font-mono font-black text-amber-400 text-xs sm:text-sm focus:outline-none p-0"
              />
              <button
                disabled={hasActiveBet && phase === 'FLYING'}
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
                className="w-7 h-6 bg-gray-800 rounded text-xs font-bold text-gray-300 hover:bg-gray-700 flex items-center justify-center cursor-pointer active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Button: BET or CASH OUT */}
          <div className="col-span-7">
            {phase === 'FLYING' && hasActiveBet && !hasCashedOut ? (
              <button
                onClick={() => executeCashout(multiplier)}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 active:scale-98 text-black font-black text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] flex flex-col items-center justify-center transition border-2 border-emerald-300 cursor-pointer"
              >
                <span>ক্যাশ আউট (CASH OUT)</span>
                <span className="text-[10px] font-mono font-bold text-black/80">৳{Math.floor(betAmount * multiplier).toLocaleString()}</span>
              </button>
            ) : hasActiveBet && phase === 'STARTING' ? (
              <button
                onClick={handleCancelBet}
                className="w-full h-12 bg-red-900/60 hover:bg-red-800 border border-red-500 text-red-200 font-bold text-xs rounded-xl flex flex-col items-center justify-center transition cursor-pointer active:scale-98"
              >
                <span>বাজি বাতিল করুন</span>
                <span className="text-[9px] text-red-400">শুরুর অপেক্ষা (৳{betAmount})</span>
              </button>
            ) : (
              <button
                disabled={hasActiveBet}
                onClick={handlePlaceBet}
                className={`w-full h-12 font-black text-xs sm:text-sm rounded-xl transition shadow-lg flex flex-col items-center justify-center border cursor-pointer active:scale-98 ${
                  hasActiveBet
                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:brightness-110 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                }`}
              >
                <span>বাজি ধরুন (BET)</span>
                <span className="text-[9px] opacity-90">৳{betAmount} দিয়ে খেলুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Auto Cashout Options */}
        <div className="flex items-center justify-between bg-[#0a0c16] px-3 py-1.5 rounded-lg border border-gray-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-[11px] sm:text-xs">
            <input
              type="checkbox"
              checked={autoCashoutEnabled}
              onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
              className="accent-red-500 rounded"
            />
            <span>অটো ক্যাশ আউট (Auto Cashout)</span>
          </label>
          {autoCashoutEnabled && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="1.1"
                max="50"
                value={autoCashoutTarget}
                onChange={(e) => setAutoCashoutTarget(Math.max(1.1, Number(e.target.value)))}
                className="w-14 bg-gray-800 text-center font-mono font-bold text-amber-400 px-1 py-0.5 rounded text-xs"
              />
              <span className="text-gray-400 font-mono text-xs">x</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Players Bets simulation */}
      <div className="bg-[#0a0c16] px-3 py-1.5 border-t border-gray-800 flex items-center justify-between text-[10px] sm:text-[11px] text-gray-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>৪,২৮০ জন খেলছেন</span>
        </div>
        <div className="flex gap-2">
          {fakeBets.slice(0, 2).map((fb, idx) => (
            <span key={idx} className="font-mono text-gray-400">
              {fb.user}: <span className={fb.status === 'cashed' ? 'text-emerald-400' : 'text-amber-400'}>৳{fb.bet} {fb.status === 'cashed' && `(${fb.cashout}x)`}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
