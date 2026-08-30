// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

interface PixiSlotGameProps {
  balance?: number;
  onUpdateBalance?: (
    newBalance: number,
    amountWonOrLost: number,
    type: 'BET' | 'WIN',
    description: string
  ) => void;
  onClose?: () => void;
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

const MULTIPLIERS = [1, 2, 3, 5, 10];
const RTP_TARGET = 0.96;

const SYMBOL_WEIGHTS = {
  garuda: 0.015,
  wild: 0.05,
  crown: 0.12,
  ring: 0.17,
  'red-gem': 0.23,
  'green-gem': 0.25,
  'blue-gem': 0.18,
};

const SOUND_PATHS: Record<string, string> = {
  bgm: '/sounds/bgm.mp3',
  spin: '/sounds/spin.mp3',
  win: '/sounds/win.mp3',
  'big-win': '/sounds/big-win.mp3',
  click: '/sounds/click.mp3',
  coin: '/sounds/coin.mp3',
};

export default function PixiSlotGame({ balance, onUpdateBalance, onClose }: PixiSlotGameProps) {
  // Safe Balance Extractor (Prevents NaN)
  const getSafeBalance = (val: any) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0 ? num : 0;
  };

  const [currentBalance, setCurrentBalance] = useState<number>(() => getSafeBalance(balance));
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [activeMultiplier, setActiveMultiplier] = useState(1);
  const [showCoins, setShowCoins] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winningCells, setWinningCells] = useState<number[]>([]);

  const coinRainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const coinRainTimeoutRef = useRef<number | null>(null);
  const coinRainRef = useRef<any[]>([]);
  const coinImageRef = useRef<HTMLImageElement | null>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const isAutoSpinRef = useRef(isAutoSpin);
  isAutoSpinRef.current = isAutoSpin;

  // Sync wallet on component update
  useEffect(() => {
    if (balance !== undefined && balance !== null) {
      setCurrentBalance(getSafeBalance(balance));
    }
  }, [balance]);

  const [grid, setGrid] = useState<string[]>(() => 
    Array(9).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].img)
  );

  const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

  const weightedPick = <T,>(items: Array<{ value: T; weight: number }>) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let target = Math.random() * totalWeight;

    for (const item of items) {
      target -= item.weight;
      if (target <= 0) return item.value;
    }

    return items[items.length - 1].value;
  };

  const buildWeightedGrid = () => {
    const weightedSymbols = SYMBOLS.map((symbol) => ({
      value: symbol.img,
      weight: SYMBOL_WEIGHTS[symbol.id] ?? 0.1,
    }));

    const cells: string[] = [];
    for (let i = 0; i < 9; i += 1) {
      cells.push(weightedPick(weightedSymbols));
    }
    return cells;
  };

  const getMultiplierFromWeight = (winWeight: number) => {
    if (winWeight >= 0.75) return 10;
    if (winWeight >= 0.5) return 5;
    if (winWeight >= 0.3) return 3;
    if (winWeight >= 0.16) return 2;
    return 1;
  };

  const calculateSpinOutcome = () => {
    const symbolPool = SYMBOLS.map((symbol) => ({
      value: symbol,
      weight: SYMBOL_WEIGHTS[symbol.id] ?? 0.1,
    }));

    let winChance = 0.32;
    const rtpFactor = Math.max(0.18, Math.min(0.82, 1 - RTP_TARGET + 0.18));
    winChance = Math.min(0.64, Math.max(0.2, winChance + rtpFactor * 0.18));

    const shouldWin = Math.random() <= winChance;
    const grid = buildWeightedGrid();

    if (!shouldWin) {
      return {
        grid,
        multiplier: 1,
        payout: 0,
        winWeight: 0,
      };
    }

    const winningSymbol = weightedPick(symbolPool.map((entry) => ({ value: entry.value, weight: entry.weight * 0.9 })));
    const payoutWeight = Math.max(0.08, (winningSymbol.payout / 50) * (0.9 + Math.random() * 0.6));

    const linePattern = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    const selectedLine = linePattern[Math.floor(Math.random() * linePattern.length)];
    const lineValues = selectedLine.map((idx) => grid[idx]);
    const assignedSymbol = lineValues[0] || winningSymbol.img;

    const rowPattern = lineValues.map((cell) => {
      const isWild = cell.includes('wild') || assignedSymbol.includes('wild');
      const matched = isWild ? winningSymbol.img : cell;
      return matched;
    });

    const basePayout = rowPattern.every((cell) => cell === rowPattern[0]) ? winningSymbol.payout * 1.2 : 0;
    const multiplier = getMultiplierFromWeight(Math.min(1, payoutWeight));
    const payout = basePayout > 0 ? basePayout * multiplier : 0;

    if (payout <= 0 && winningSymbol.id !== 'wild') {
      return {
        grid: buildWeightedGrid(),
        multiplier: 1,
        payout: 0,
        winWeight: 0,
      };
    }

    const finalGrid = [...grid];
    selectedLine.forEach((idx, order) => {
      const symbolImg = winningSymbol.img;
      finalGrid[idx] = order === 1 && winningSymbol.id === 'wild' ? symbolImg : symbolImg;
    });

    return {
      grid: finalGrid,
      multiplier,
      payout,
      winWeight: Math.min(1, payoutWeight),
    };
  };

  const audioUnlockedRef = useRef(false);

  const ensureAudioContext = async () => {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const startBgm = async () => {
    await ensureAudioContext();

    if (!bgmAudioRef.current) {
      const bgmAudio = new Audio(SOUND_PATHS.bgm);
      bgmAudio.loop = true;
      bgmAudio.volume = 0.18;
      bgmAudio.preload = 'auto';
      bgmAudioRef.current = bgmAudio;
    }

    const bgmAudio = bgmAudioRef.current;
    if (!bgmAudio) return;

    try {
      bgmAudio.loop = true;
      if (bgmAudio.paused) {
        await bgmAudio.play();
      }
    } catch (e) {
      console.warn('BGM failed to start:', e);
    }
  };

  const stopBgm = () => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current.currentTime = 0;
    }
  };

  const unlockAudio = async () => {
    if (audioUnlockedRef.current) {
      await startBgm();
      return;
    }

    audioUnlockedRef.current = true;

    try {
      const audio = new Audio(SOUND_PATHS.click);
      audio.volume = 0.04;
      audio.play().catch(() => {});
    } catch (e) {}

    await startBgm();
  };

  const stopSpinAudio = () => {
    if (spinAudioRef.current) {
      spinAudioRef.current.pause();
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current = null;
    }
  };

  const playSound = async (soundName: string) => {
    try {
      const safeSoundName = soundName in SOUND_PATHS ? soundName : 'click';
      const audio = new Audio(SOUND_PATHS[safeSoundName]);
      audio.preload = 'auto';
      audio.volume = soundName === 'spin' ? 0.6 : soundName === 'coin' ? 0.9 : 0.7;

      if (soundName === 'spin') {
        stopSpinAudio();
        spinAudioRef.current = audio;
      }

      await ensureAudioContext();
      await audio.play().catch(() => {
        unlockAudio();
      });
      return audio;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const img = new Image();
    img.src = '/images/gold-coin.png';
    img.onload = () => {
      coinImageRef.current = img;
    };

    return () => {
      if (coinRainTimeoutRef.current) {
        window.clearTimeout(coinRainTimeoutRef.current);
      }
      cleanupCoinRain();
    };
  }, []);

  const cleanupCoinRain = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (coinRainTimeoutRef.current) {
      window.clearTimeout(coinRainTimeoutRef.current);
      coinRainTimeoutRef.current = null;
    }

    if (coinRainCanvasRef.current) {
      const canvas = coinRainCanvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    coinRainRef.current = [];
  };

  const triggerCoinBurst = (durationMs = 3000) => {
    const canvas = coinRainCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const parent = canvas.parentElement;
    const bounds = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const burst = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.4,
      radius: 12 + Math.random() * 10,
      velocityX: (Math.random() - 0.5) * 3.4,
      velocityY: 2.2 + Math.random() * 3.2,
      gravity: 0.09 + Math.random() * 0.14,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      alpha: 0.8 + Math.random() * 0.2,
    }));

    coinRainRef.current = burst;
    const startTime = performance.now();
    const animationDuration = Math.min(Math.max(durationMs, 2500), 3000);

    const drawCoins = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      if (elapsed > animationDuration) {
        cleanupCoinRain();
        return;
      }

      context.clearRect(0, 0, width, height);

      coinRainRef.current.forEach((coin) => {
        coin.x += coin.velocityX;
        coin.y += coin.velocityY;
        coin.velocityY += coin.gravity;
        coin.rotation += coin.spin;

        if (coin.y > height + 30) {
          coin.y = -20;
          coin.x = Math.random() * width;
          coin.velocityX = (Math.random() - 0.5) * 3.4;
          coin.velocityY = 2.2 + Math.random() * 3.2;
        }

        context.save();
        context.translate(coin.x, coin.y);
        context.rotate(coin.rotation);
        context.globalAlpha = coin.alpha;

        if (coinImageRef.current) {
          context.drawImage(coinImageRef.current, -coin.radius, -coin.radius, coin.radius * 2, coin.radius * 2);
        } else {
          context.beginPath();
          context.arc(0, 0, coin.radius, 0, Math.PI * 2);
          context.fillStyle = '#fbbf24';
          context.fill();
          context.lineWidth = 2;
          context.strokeStyle = '#b45309';
          context.stroke();
        }

        context.restore();
      });

      animationFrameRef.current = requestAnimationFrame(drawCoins);
    };

    animationFrameRef.current = requestAnimationFrame(drawCoins);
    coinRainTimeoutRef.current = window.setTimeout(() => {
      cleanupCoinRain();
    }, animationDuration + 100);
  };

  const handleSpin = async () => {
    try {
      if (currentBalance < bet || isSpinning) {
        setIsAutoSpin(false);
        if (currentBalance < bet && !isSpinning) {
          alert("পর্যাপ্ত ব্যালেন্স নেই!");
        }
        return;
      }

      await unlockAudio();
      await playSound('click');
      await playSound('spin');

      const newBal = currentBalance - bet;
      setCurrentBalance(newBal);
      if (onUpdateBalance) {
        onUpdateBalance(newBal, -bet, 'BET', 'Fortune Garuda Slot');
      }

      setIsSpinning(true);
      setWinAmount(0);
      setShowCoins(false);
      setShowWinPopup(false);
      setWinningCells([]);

      let counter = 0;
      const interval = setInterval(() => {
        const preview = buildWeightedGrid();
        const previewWeight = Math.random();
        const previewMult = getMultiplierFromWeight(previewWeight);

        setGrid(preview);
        setActiveMultiplier(previewMult);
        counter++;

        if (counter > 14) {
          clearInterval(interval);
          stopSpinAudio();
          const outcome = calculateSpinOutcome();
          setGrid(outcome.grid);
          setActiveMultiplier(outcome.multiplier || 1);
          evaluateWin(outcome.grid, outcome.multiplier || 1, newBal, outcome.payout, outcome.winWeight);
          setIsSpinning(false);
        }
      }, 90);
    } catch (err) {
      setIsSpinning(false);
      setIsAutoSpin(false);
    }
  };

  const evaluateWin = (finalGrid: string[], multiplier: number, latestBal: number, forcePayout?: number, winWeight?: number) => {
    try {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      let baseWin = 0;
      const winningLineSet = new Set<number>();
      const matchingLines: number[][] = [];

      lines.forEach((line) => {
        const s1 = finalGrid[line[0]] || '';
        const s2 = finalGrid[line[1]] || '';
        const s3 = finalGrid[line[2]] || '';

        const isWild1 = s1.includes('wild');
        const isWild2 = s2.includes('wild');
        const isWild3 = s3.includes('wild');

        const matchBase = [s1, s2, s3].find((s) => s && !s.includes('wild')) || s1;

        if (
          matchBase &&
          (s1 === matchBase || isWild1) &&
          (s2 === matchBase || isWild2) &&
          (s3 === matchBase || isWild3)
        ) {
          const symbolObj = SYMBOLS.find((s) => matchBase.includes(s.id));
          if (symbolObj && symbolObj.payout) {
            baseWin += bet * symbolObj.payout;
            matchingLines.push(line);
            line.forEach((cellIndex) => winningLineSet.add(cellIndex));
          }
        }
      });

      const finalMultiplier = multiplier || getMultiplierFromWeight(Number(winWeight) || 0.2);
      const totalWin = forcePayout && forcePayout > 0 ? forcePayout : baseWin * finalMultiplier;

      if (totalWin > 0) {
        const winningCellsForLine = Array.from(winningLineSet);
        setWinningCells(winningCellsForLine);
        setWinAmount(totalWin);
        setShowWinPopup(true);
        const updated = latestBal + totalWin;
        setCurrentBalance(updated);
        if (onUpdateBalance) {
          onUpdateBalance(updated, totalWin, 'WIN', 'Fortune Garuda Slot Win');
        }

        const coinAudio = playSound('coin');
        const winAudio = playSound(totalWin >= bet * 15 ? 'big-win' : 'win');
        const coinDuration = coinAudio && Number.isFinite((coinAudio as HTMLAudioElement).duration) && (coinAudio as HTMLAudioElement).duration > 0
          ? (coinAudio as HTMLAudioElement).duration * 1000
          : 1800;
        const winDuration = winAudio && Number.isFinite((winAudio as HTMLAudioElement).duration) && (winAudio as HTMLAudioElement).duration > 0
          ? (winAudio as HTMLAudioElement).duration * 1000
          : 2000;

        const effectDuration = Math.min(3000, Math.max(2200, Math.min(coinDuration, winDuration)));
        triggerCoinBurst(effectDuration);
        setShowCoins(true);

        if (coinRainTimeoutRef.current) {
          window.clearTimeout(coinRainTimeoutRef.current);
        }

        coinRainTimeoutRef.current = window.setTimeout(() => {
          setShowCoins(false);
          setShowWinPopup(false);
          setWinningCells([]);
          cleanupCoinRain();
        }, 3000);
      } else {
        setWinningCells([]);
      }
    } catch (err) {
      console.error('Error evaluating win:', err);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isAutoSpin && !isSpinning) {
      timer = setTimeout(() => {
        if (isAutoSpinRef.current) handleSpin();
      }, 700);
    }
    return () => clearTimeout(timer);
  }, [isAutoSpin, isSpinning]);

  const handleClose = async () => {
    await unlockAudio();
    await playSound('click');
    stopBgm();
    setIsAutoSpin(false);
    if (onClose) onClose();
    else window.history.back();
  };

  return (
    <>
      <div
        className="w-full max-w-lg mx-auto h-[95vh] max-h-[720px] flex flex-col justify-between p-3 overflow-hidden rounded-3xl bg-black/95 border-2 border-amber-500/70 relative"
        style={{ position: 'relative' }}
      >
        <canvas
          ref={coinRainCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 50,
            pointerEvents: 'none',
            display: showCoins || winAmount > 0 || showWinPopup ? 'block' : 'none',
          }}
          aria-label="Coin rain effect"
        />

        <div className="flex flex-row justify-between items-center w-full shrink-0 mb-1">
          <button
            onClick={handleClose}
            className="px-3.5 py-1.5 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-xs rounded-xl border border-red-500 active:scale-95 transition-all shadow-md flex items-center gap-1"
          >
            <span>←</span> Back
          </button>

          <div className="flex items-center gap-2 bg-black/70 px-3.5 py-1 rounded-xl border border-amber-500/40">
            <span className="text-base">💰</span>
            <div>
              <p className="text-[9px] uppercase font-bold text-amber-400 leading-none">Wallet</p>
              <p className="text-sm font-black text-amber-300 leading-tight">৳ {currentBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="w-48 h-28 mx-auto rounded-2xl border-2 border-amber-500/70 bg-zinc-900/90 p-1 flex items-center justify-center shrink-0 mb-2 overflow-hidden shadow-lg">
          <img
            src="/images/garuda.gif"
            alt="Animated Garuda"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="flex-1 flex items-center justify-center w-full py-1 min-h-0">
          <div className="flex flex-row items-stretch gap-2 w-full h-full">
            <div className="flex-1 p-2 bg-zinc-900/90 rounded-2xl border-2 border-amber-500/50 shadow-inner min-h-0 relative">
              {showWinPopup && winAmount > 0 && (
                <div className="absolute left-1/2 top-2 -translate-x-1/2 z-30 pointer-events-none">
                  <div className="px-4 py-2 rounded-full border-2 border-amber-200 bg-gradient-to-r from-emerald-500 via-yellow-400 to-amber-500 text-black shadow-[0_0_22px_rgba(250,204,21,0.9)] animate-pulse">
                    <span className="font-black text-[10px] uppercase tracking-[0.25em] mr-2">Win</span>
                    <span className="font-black text-sm">৳ {winAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 flex-1 max-h-[340px] p-1 h-full mx-auto relative z-10">
                {grid.map((imgSrc, idx) => {
                  const isWinningCell = winningCells.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`border-2 rounded-xl bg-zinc-900/90 aspect-square flex items-center justify-center relative overflow-hidden max-h-[105px] max-w-[105px] mx-auto w-full h-full transition-all duration-200 ${
                        isWinningCell
                          ? 'border-emerald-300 bg-emerald-500/10 shadow-[0_0_18px_rgba(52,211,153,0.7)] scale-[1.03] animate-pulse'
                          : 'border-amber-500/60'
                      }`}
                    >
                      <img
                        src={imgSrc}
                        alt="symbol"
                        className={`w-full h-full object-contain mix-blend-screen transition-all ${isSpinning ? 'animate-pulse opacity-60 scale-95' : 'opacity-100 scale-100'}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between h-full bg-zinc-900/90 p-1.5 rounded-xl border-2 border-amber-500/60 overflow-y-auto min-w-[50px]">
              {['1x', '2x', '3x', '4x', '5x', '10x', '15x', '20x', '30x', '50x', '100x'].map((m) => {
                const value = Number(m.replace('x', ''));
                const isActive = activeMultiplier === value;
                return (
                  <div
                    key={m}
                    className={`flex-1 flex items-center justify-center font-bold text-xs rounded-lg border border-amber-500/30 my-0.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-yellow-200 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                        : 'bg-stone-900 text-amber-500/70 border-amber-500/20 opacity-80'
                    }`}
                  >
                    {m}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 mt-auto pt-1 bg-zinc-950 sticky bottom-0 z-20">
          <div className="bg-stone-900/90 py-1.5 px-4 rounded-xl border border-amber-500/30 flex justify-between items-center">
            <span className="text-amber-400 font-extrabold text-xs tracking-wider">WIN</span>
            <span className="text-white font-black text-base">৳ {winAmount.toFixed(2)}</span>
          </div>

          <div className="flex flex-row items-center justify-between gap-2 w-full">
            <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-amber-500/40">
              <button
                onClick={async () => {
                  await unlockAudio();
                  await playSound('click');
                  setBet(prev => Math.max(10, prev - 10));
                }}
                className="w-7 h-7 bg-stone-800 border border-amber-500/40 rounded-lg font-black text-sm text-amber-400 active:scale-90"
              >
                -
              </button>
              <div className="px-2 text-center">
                <p className="text-[8px] uppercase text-gray-400 font-bold">BET</p>
                <p className="font-extrabold text-xs text-amber-300">৳{bet}</p>
              </div>
              <button
                onClick={async () => {
                  await unlockAudio();
                  await playSound('click');
                  setBet(prev => prev + 10);
                }}
                className="w-7 h-7 bg-stone-800 border border-amber-500/40 rounded-lg font-black text-sm text-amber-400 active:scale-90"
              >
                +
              </button>
            </div>

            <button
              onClick={handleSpin}
              disabled={isSpinning || currentBalance < bet || isAutoSpin}
              className={`flex-1 py-3 rounded-2xl font-black text-lg tracking-widest shadow-xl border-2 transition-all ${
                isSpinning || currentBalance < bet
                  ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black border-yellow-200 hover:brightness-110 active:scale-95 shadow-amber-500/30'
              }`}
            >
              {isSpinning ? 'SPIN...' : 'SPIN'}
            </button>

            <button
              onClick={async () => {
                await unlockAudio();
                await playSound('click');
                setIsAutoSpin(!isAutoSpin);
              }}
              className={`px-3 py-3 rounded-2xl font-extrabold text-xs border transition-all ${
                isAutoSpin
                  ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-600/40'
                  : 'bg-stone-900 text-amber-400 border-amber-500/40 hover:bg-stone-800'
              }`}
            >
              {isAutoSpin ? 'STOP' : 'AUTO'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}