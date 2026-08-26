import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Info,
  RefreshCw,
  Award,
  Flame,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { calculateRTPWin, determineRTPTier } from '../../utils/rtpManager';
import { BET_PRESETS } from '../../utils/betPresets';

interface EgyptianSlotGameProps {
  balance: number;
  onUpdateBalance: (
    newBalance: number,
    amountWonOrLost: number,
    type: 'BET' | 'WIN',
    description: string
  ) => void;
  onClose: () => void;
}

// 5 Columns x 4 Rows = 20 Interactive Blocks
const COLS = 5;
const ROWS = 4;
const TOTAL_TILES = COLS * ROWS; // 20

export interface SlotSymbol {
  id: string;
  name: string;
  nameBn: string;
  type: 'character' | 'artifact' | 'letter' | 'multiplier';
  payout: number; // Base payout multiplier
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  multiplierValue?: number;
  glowColor: string;
}

const SYMBOLS: SlotSymbol[] = [
  // High-Tier Characters & Gods
  {
    id: 'pharaoh',
    name: 'Pharaoh King',
    nameBn: 'রাজা ফারাও',
    type: 'character',
    payout: 25,
    icon: '👑',
    color: 'text-amber-300',
    bgColor: 'from-amber-900/60 to-yellow-950/80',
    borderColor: 'border-yellow-400',
    glowColor: 'rgba(250, 204, 21, 0.6)',
  },
  {
    id: 'cleopatra',
    name: 'Cleopatra Queen',
    nameBn: 'রানী ক্লিওপেট্রা',
    type: 'character',
    payout: 18,
    icon: '👸',
    color: 'text-emerald-300',
    bgColor: 'from-emerald-950/70 to-teal-950/80',
    borderColor: 'border-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.6)',
  },
  {
    id: 'anubis',
    name: 'Anubis Guardian',
    nameBn: 'আনুবিস রক্ষক',
    type: 'character',
    payout: 14,
    icon: '🐺',
    color: 'text-purple-300',
    bgColor: 'from-purple-950/70 to-indigo-950/80',
    borderColor: 'border-purple-400',
    glowColor: 'rgba(192, 132, 252, 0.6)',
  },
  {
    id: 'scarab',
    name: 'Golden Scarab',
    nameBn: 'গোল্ডেন স্কারাব',
    type: 'artifact',
    payout: 10,
    icon: '🪲',
    color: 'text-yellow-300',
    bgColor: 'from-amber-950/70 to-orange-950/80',
    borderColor: 'border-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.6)',
  },
  {
    id: 'horus_eye',
    name: 'Eye of Horus',
    nameBn: 'হোরাসের চোখ',
    type: 'artifact',
    payout: 8,
    icon: '👁️',
    color: 'text-cyan-300',
    bgColor: 'from-cyan-950/70 to-blue-950/80',
    borderColor: 'border-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.6)',
  },
  {
    id: 'ankh',
    name: 'Golden Ankh',
    nameBn: 'পবিত্র আনখ',
    type: 'artifact',
    payout: 6,
    icon: '☥',
    color: 'text-yellow-400',
    bgColor: 'from-yellow-950/70 to-amber-950/80',
    borderColor: 'border-yellow-500',
    glowColor: 'rgba(234, 179, 8, 0.6)',
  },

  // Hieroglyphic Letters
  {
    id: 'letter_a',
    name: 'Ace Hieroglyph',
    nameBn: 'হায়ারোগ্লিফ A',
    type: 'letter',
    payout: 4,
    icon: '𓁹 A',
    color: 'text-red-300',
    bgColor: 'from-red-950/60 to-rose-950/80',
    borderColor: 'border-red-400/80',
    glowColor: 'rgba(248, 113, 113, 0.5)',
  },
  {
    id: 'letter_k',
    name: 'King Hieroglyph',
    nameBn: 'হায়ারোগ্লিফ K',
    type: 'letter',
    payout: 3,
    icon: '𓀠 K',
    color: 'text-blue-300',
    bgColor: 'from-blue-950/60 to-cyan-950/80',
    borderColor: 'border-blue-400/80',
    glowColor: 'rgba(96, 165, 250, 0.5)',
  },
  {
    id: 'letter_q',
    name: 'Queen Hieroglyph',
    nameBn: 'হায়ারোগ্লিফ Q',
    type: 'letter',
    payout: 2.5,
    icon: '𓁐 Q',
    color: 'text-pink-300',
    bgColor: 'from-pink-950/60 to-purple-950/80',
    borderColor: 'border-pink-400/80',
    glowColor: 'rgba(244, 114, 182, 0.5)',
  },
  {
    id: 'letter_j',
    name: 'Jack Hieroglyph',
    nameBn: 'হায়ারোগ্লিফ J',
    type: 'letter',
    payout: 2,
    icon: '𓋹 J',
    color: 'text-emerald-300',
    bgColor: 'from-emerald-950/60 to-green-950/80',
    borderColor: 'border-emerald-400/80',
    glowColor: 'rgba(52, 211, 153, 0.5)',
  },

  // Multiplier Special Boosters
  {
    id: 'mult_2',
    name: '2X Booster',
    nameBn: '২ গুণ বুস্টার',
    type: 'multiplier',
    payout: 0,
    multiplierValue: 2,
    icon: '2X',
    color: 'text-amber-200 font-black font-mono',
    bgColor: 'from-amber-600/50 via-yellow-500/40 to-amber-900/70',
    borderColor: 'border-yellow-300',
    glowColor: 'rgba(253, 224, 71, 0.8)',
  },
  {
    id: 'mult_5',
    name: '5X Booster',
    nameBn: '৫ গুণ বুস্টার',
    type: 'multiplier',
    payout: 0,
    multiplierValue: 5,
    icon: '5X',
    color: 'text-orange-200 font-black font-mono',
    bgColor: 'from-orange-600/50 via-amber-500/40 to-red-900/70',
    borderColor: 'border-orange-400',
    glowColor: 'rgba(251, 146, 60, 0.8)',
  },
  {
    id: 'mult_10',
    name: '10X Booster',
    nameBn: '১০ গুণ বুস্টার',
    type: 'multiplier',
    payout: 0,
    multiplierValue: 10,
    icon: '10X',
    color: 'text-emerald-200 font-black font-mono',
    bgColor: 'from-emerald-600/50 via-teal-500/40 to-green-900/70',
    borderColor: 'border-emerald-300',
    glowColor: 'rgba(110, 231, 183, 0.85)',
  },
  {
    id: 'mult_25',
    name: '25X Golden Sun',
    nameBn: '২৫ গুণ সূর্য্যশক্তি',
    type: 'multiplier',
    payout: 0,
    multiplierValue: 25,
    icon: '25X',
    color: 'text-purple-200 font-black font-mono',
    bgColor: 'from-purple-600/50 via-pink-500/40 to-indigo-900/70',
    borderColor: 'border-purple-300',
    glowColor: 'rgba(216, 180, 254, 0.9)',
  },
  {
    id: 'mult_50',
    name: '50X Pharaoh Gem',
    nameBn: '৫০ গুণ মেগা রত্ন',
    type: 'multiplier',
    payout: 0,
    multiplierValue: 50,
    icon: '50X',
    color: 'text-yellow-100 font-black font-mono',
    bgColor: 'from-yellow-400/60 via-amber-300/50 to-red-700/80',
    borderColor: 'border-yellow-200',
    glowColor: 'rgba(254, 240, 138, 1)',
  },
];

// Weighted random generator
function getRandomSymbol(): SlotSymbol {
  const rand = Math.random() * 100;
  if (rand < 1.2) return SYMBOLS.find((s) => s.id === 'mult_50')!;
  if (rand < 3.0) return SYMBOLS.find((s) => s.id === 'mult_25')!;
  if (rand < 6.5) return SYMBOLS.find((s) => s.id === 'mult_10')!;
  if (rand < 11.5) return SYMBOLS.find((s) => s.id === 'mult_5')!;
  if (rand < 18.0) return SYMBOLS.find((s) => s.id === 'mult_2')!;
  if (rand < 26.0) return SYMBOLS.find((s) => s.id === 'pharaoh')!;
  if (rand < 35.0) return SYMBOLS.find((s) => s.id === 'cleopatra')!;
  if (rand < 45.0) return SYMBOLS.find((s) => s.id === 'anubis')!;
  if (rand < 55.0) return SYMBOLS.find((s) => s.id === 'scarab')!;
  if (rand < 65.0) return SYMBOLS.find((s) => s.id === 'horus_eye')!;
  if (rand < 75.0) return SYMBOLS.find((s) => s.id === 'ankh')!;
  if (rand < 82.0) return SYMBOLS.find((s) => s.id === 'letter_a')!;
  if (rand < 89.0) return SYMBOLS.find((s) => s.id === 'letter_k')!;
  if (rand < 95.0) return SYMBOLS.find((s) => s.id === 'letter_q')!;
  return SYMBOLS.find((s) => s.id === 'letter_j')!;
}

// Initial 5x4 Grid Setup (20 blocks)
function generateInitialGrid(): SlotSymbol[][] {
  const grid: SlotSymbol[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: SlotSymbol[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(getRandomSymbol());
    }
    grid.push(row);
  }
  return grid;
}

export default function EgyptianSlotGame({
  balance,
  onUpdateBalance,
  onClose,
}: EgyptianSlotGameProps) {
  const [grid, setGrid] = useState<SlotSymbol[][]>(generateInitialGrid);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false, false, false]);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [gameWinnings, setGameWinnings] = useState<number>(0);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [accumulatedMultiplier, setAccumulatedMultiplier] = useState<number>(1);
  const [winningTiles, setWinningTiles] = useState<Set<string>>(new Set());
  const [bigWinOverlay, setBigWinOverlay] = useState<{ show: boolean; title: string; amount: number } | null>(null);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [turboMode, setTurboMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string>('');
  const [selectedSymbolDetail, setSelectedSymbolDetail] = useState<SlotSymbol | null>(null);
  const [jackpotPool, setJackpotPool] = useState<number>(145890);

  const autoSpinRef = useRef(autoSpin);
  autoSpinRef.current = autoSpin;

  // Slowly increment jackpot for casino excitement
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotPool((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const betOptions = BET_PRESETS;

  // Evaluate 5x4 Grid Win Logic - Vertical Fall Matching (Top-to-Bottom across 5 Columns)
  const evaluateGridWins = (newGrid: SlotSymbol[][], currentBet: number) => {
    let totalWin = 0;
    const winsSet = new Set<string>();
    let totalMult = 1;

    // 1. Check for multiplier tiles on the 20-block board
    const multiplierFound: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const symbol = newGrid[r][c];
        if (symbol.type === 'multiplier' && symbol.multiplierValue) {
          multiplierFound.push(symbol.multiplierValue);
          winsSet.add(`${r}-${c}`);
        }
      }
    }

    if (multiplierFound.length > 0) {
      totalMult = multiplierFound.reduce((acc, m) => acc * m, 1);
      setAccumulatedMultiplier(totalMult);
    } else {
      setAccumulatedMultiplier(1);
    }

    // 2. Evaluate Vertical Column Matching (Top to Bottom across 5 Columns)
    // ৫ কলামের ঘরে ওপর থেকে নিচে প্রতীক মিললে পে-আউট দেওয়া হবে
    for (let c = 0; c < COLS; c++) {
      // Check from top (row 0) downward
      const topSymbol = newGrid[0][c];
      if (topSymbol.type !== 'multiplier') {
        let matchCount = 1;
        for (let r = 1; r < ROWS; r++) {
          const currentSym = newGrid[r][c];
          if (currentSym.id === topSymbol.id || currentSym.id === 'scarab') {
            matchCount++;
          } else {
            break;
          }
        }

        if (matchCount >= 3) {
          // Mark vertical winning tiles
          for (let r = 0; r < matchCount; r++) {
            winsSet.add(`${r}-${c}`);
          }
          const colMult = matchCount === 4 ? 3.0 : 1.5;
          totalWin += currentBet * (topSymbol.payout / 10) * colMult;
        }
      }

      // Also check consecutive 3-match starting at row 1 (rows 1, 2, 3)
      const midSymbol = newGrid[1][c];
      if (midSymbol.type !== 'multiplier' && (topSymbol.id !== midSymbol.id || topSymbol.type === 'multiplier')) {
        let matchCount = 1;
        for (let r = 2; r < ROWS; r++) {
          const currentSym = newGrid[r][c];
          if (currentSym.id === midSymbol.id || currentSym.id === 'scarab') {
            matchCount++;
          } else {
            break;
          }
        }

        if (matchCount >= 3) {
          for (let r = 1; r < ROWS; r++) {
            winsSet.add(`${r}-${c}`);
          }
          totalWin += currentBet * (midSymbol.payout / 10) * 1.5;
        }
      }
    }

    // 3. Diagonal / Adjacent Vertical Cascade lines
    const cascadeLeft = [newGrid[0][0], newGrid[1][1], newGrid[2][2], newGrid[3][3]];
    if (
      cascadeLeft[0].type !== 'multiplier' &&
      ((cascadeLeft[0].id === cascadeLeft[1].id && cascadeLeft[1].id === cascadeLeft[2].id) ||
        (cascadeLeft[0].id === 'scarab' && cascadeLeft[1].id === cascadeLeft[2].id))
    ) {
      winsSet.add('0-0');
      winsSet.add('1-1');
      winsSet.add('2-2');
      totalWin += currentBet * (cascadeLeft[0].payout / 10) * 1.6;
    }

    // 4. Count Scarab Scatters anywhere on board
    let scarabCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newGrid[r][c].id === 'scarab') {
          scarabCount++;
          winsSet.add(`${r}-${c}`);
        }
      }
    }

    if (scarabCount >= 3) {
      totalWin += currentBet * (scarabCount * 5);
    }

    // Apply accumulated multipliers
    const finalPayout = Math.round(totalWin * totalMult);

    return { finalPayout, winsSet, totalMult };
  };

  // Perform Slot Spin
  const handleSpin = () => {
    if (isSpinning) return;

    if (balance < betAmount) {
      alert('আপনার পর্যাপ্ত ব্যালেন্স নেই! অনুগ্রহ করে ডিপোজিট করুন।');
      setAutoSpin(false);
      return;
    }

    sounds.playClick();
    setIsSpinning(true);
    setLastWinAmount(0);
    setWinningTiles(new Set());
    setWithdrawSuccess('');

    // Deduct bet from main user balance
    const newBal = balance - betAmount;
    onUpdateBalance(newBal, betAmount, 'BET', `Egyptian 5x4 Slots Bet (৳${betAmount})`);

    // Column-by-column rolling animations
    setSpinningCols([true, true, true, true, true]);

    const spinSpeed = turboMode ? 200 : 400;

    // Generate Final Grid
    const newFinalGrid: SlotSymbol[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: SlotSymbol[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push(getRandomSymbol());
      }
      newFinalGrid.push(row);
    }

    // Sequentially stop each of the 5 columns
    for (let col = 0; col < COLS; col++) {
      setTimeout(() => {
        setSpinningCols((prev) => {
          const next = [...prev];
          next[col] = false;
          return next;
        });

        if (!isMuted) {
          sounds.playSpinTick();
        }

        // When the final 5th column lands:
        if (col === COLS - 1) {
          setGrid(newFinalGrid);
          setIsSpinning(false);

          // Evaluate Raw Payout
          const { finalPayout: rawPayout, winsSet, totalMult } = evaluateGridWins(newFinalGrid, betAmount);

          // Apply 92%-94% RTP Engine (30% Loss, 60% Low 1-2x, 8% Med 3-5x, 2% High 10x+, Max 10x cap, Streak protection)
          const finalPayout = calculateRTPWin(betAmount, rawPayout);

          if (finalPayout > 0) {
            setWinningTiles(winsSet);
            setLastWinAmount(finalPayout);
            setGameWinnings((prev) => prev + finalPayout);

            if (!isMuted) {
              sounds.playWin();
            }

            // Big win popups
            if (finalPayout >= betAmount * 10) {
              setBigWinOverlay({
                show: true,
                title: finalPayout >= betAmount * 15 ? '👑 PHARAOH MEGA JACKPOT 👑' : '🔥 ANCIENT BIG WIN 🔥',
                amount: finalPayout,
              });
              setTimeout(() => setBigWinOverlay(null), 3500);
            }
          } else {
            setWinningTiles(new Set());
            setLastWinAmount(0);
          }

          // Handle Auto Spin cycle
          if (autoSpinRef.current) {
            setTimeout(() => {
              if (autoSpinRef.current) {
                handleSpin();
              }
            }, 1200);
          }
        }
      }, 700 + col * spinSpeed);
    }
  };

  // Instant Withdraw / Cashout accumulated slot winnings to main wallet
  const handleWithdrawWinnings = () => {
    if (gameWinnings <= 0 || isWithdrawing) return;

    sounds.playClick();
    setIsWithdrawing(true);

    setTimeout(() => {
      const transferAmount = gameWinnings;
      const updatedBalance = balance + transferAmount;

      onUpdateBalance(
        updatedBalance,
        transferAmount,
        'WIN',
        `Egyptian Slot Cashout Winnings (৳${transferAmount.toLocaleString()})`
      );

      sounds.playCashout();
      setGameWinnings(0);
      setIsWithdrawing(false);
      setWithdrawSuccess(`৳${transferAmount.toLocaleString()} BDT সফলভাবে আপনার মেইন ওয়ালেটে যোগ হয়েছে!`);

      setTimeout(() => setWithdrawSuccess(''), 4000);
    }, 700);
  };

  // Toggle Auto Spin
  const toggleAutoSpin = () => {
    sounds.playClick();
    if (autoSpin) {
      setAutoSpin(false);
      setAutoSpinCount(0);
    } else {
      setAutoSpin(true);
      setAutoSpinCount(25);
      if (!isSpinning) {
        handleSpin();
      }
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#070A10] text-gray-100 rounded-3xl border border-[#FFC700]/40 shadow-[0_0_50px_rgba(255,199,0,0.25)] overflow-hidden font-sans relative flex flex-col max-h-[95vh] selection:bg-[#FFC700] selection:text-black">
      {/* Ancient Desert Background with Pyramids & Sand Atmospheric Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F1424] via-[#0A0D18] to-[#05070C] opacity-95 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-yellow-900/5 to-transparent pointer-events-none" />

      {/* 1. TOP BAR: Clear, Highlighted Main Wallet Balance Container */}
      <div className="relative z-20 p-3 sm:p-3.5 bg-gradient-to-r from-[#101626] via-[#161F36] to-[#101626] border-b border-[#FFC700]/30 backdrop-blur-md flex items-center justify-between shadow-md">
        {/* Left: Pharaoh Logo & Title */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFC700] via-amber-400 to-yellow-300 text-black flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(255,199,0,0.5)] border border-yellow-200">
            👑
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-black italic text-[#FFC700] tracking-wider uppercase leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                PHARAOH'S 5x4 REIGN
              </h2>
              <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-400/20 text-[#FFC700] border border-[#FFC700]/40">
                20 BLOCKS
              </span>
            </div>
            <p className="text-[9px] text-amber-200/80 font-mono tracking-wide mt-0.5">
              Ancient Egyptian Gold Mini-Game
            </p>
          </div>
        </div>

        {/* Center/Right: Highlighted Main Wallet Balance Container */}
        <div className="flex items-center gap-2">
          {/* Main Wallet Container (Highlighted & Clear) */}
          <div className="bg-[#080B12] border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-xl px-2.5 sm:px-3 py-1 text-right">
            <span className="text-[8px] text-emerald-400 uppercase font-black tracking-wider block leading-none">
              মেইন ওয়ালেট (MAIN WALLET):
            </span>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-xs sm:text-sm font-black font-mono text-emerald-300 tracking-tight">
                ৳{balance.toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-400/90 font-bold">BDT</span>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setJackpotPool((p) => p + 50);
                }}
                className="text-gray-400 hover:text-[#FFC700] transition ml-0.5 p-0.5 cursor-pointer"
                title="Refresh Account Balance"
              >
                <RefreshCw size={11} className="hover:rotate-180 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Audio & Info toggles */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#FFC700]" />}
          </button>

          <button
            type="button"
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-[#FFC700] hover:text-white transition cursor-pointer"
            title="Paytable & Rules"
          >
            <Info size={14} />
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-300 hover:text-white transition cursor-pointer"
            title="Exit Game"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. GOLDEN JACKPOT & WINNINGS TICKER */}
      <div className="relative z-10 bg-gradient-to-r from-amber-950/60 via-yellow-900/40 to-amber-950/60 px-3 py-1.5 border-b border-[#FFC700]/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#FFC700] font-black">
          <Trophy size={13} className="animate-bounce" />
          <span className="text-[10px] tracking-wider uppercase font-mono">
            মেগা ফারাও জ্যাকপট:
          </span>
          <span className="text-xs font-black font-mono text-yellow-300 drop-shadow-[0_0_8px_rgba(255,199,0,0.8)]">
            ৳{jackpotPool.toLocaleString()} BDT
          </span>
        </div>

        {/* Win Details Summary Badge */}
        <div className="flex items-center gap-1.5">
          <div className="bg-black/50 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
            <span className="text-amber-300 font-bold">উইনিংস:</span>
            <span className="font-mono font-black text-emerald-400">৳{gameWinnings.toLocaleString()} BDT</span>
          </div>
        </div>
      </div>

      {/* 3. SCROLLABLE MAIN GAME BOARD CONTAINER */}
      <div className="relative z-10 p-3 sm:p-4 flex-1 overflow-y-auto no-scrollbar space-y-3">
        {/* Withdraw Success Notification */}
        {withdrawSuccess && (
          <div className="bg-emerald-950/90 border border-emerald-500 rounded-2xl p-2.5 text-center space-y-0.5 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-black text-xs">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>{withdrawSuccess}</span>
            </div>
          </div>
        )}

        {/* Multiplier / Booster Alert Strip */}
        {accumulatedMultiplier > 1 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-[#FFC700]/30 to-amber-500/20 border border-[#FFC700] rounded-xl px-3 py-1 text-center animate-pulse flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-[#FFC700]" />
            <span className="text-xs font-black text-[#FFC700] uppercase font-mono tracking-wider">
              🔥 সক্রিয় গোল্ডেন মাল্টিপ্লায়ার: {accumulatedMultiplier}X বুস্ট!
            </span>
          </div>
        )}

        {/* 4. THE 5x4 INTERACTIVE REWARD TILES GRID (20 Blocks Total - Vertical Fall Physics) */}
        <div className="relative bg-gradient-to-b from-[#131A2E] via-[#0E1322] to-[#0A0D17] p-2.5 sm:p-3.5 rounded-3xl border-2 border-[#FFC700]/60 shadow-[0_0_30px_rgba(255,199,0,0.2)] overflow-hidden">
          {/* Golden Egyptian Border Accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-yellow-300 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-yellow-300 rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-yellow-300 rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-yellow-300 rounded-br-xl pointer-events-none" />

          {/* 5 Column Grid Layout with 4 Rows each = 20 Blocks (Vertical Fall Animation) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {Array.from({ length: COLS }).map((_, colIndex) => {
              const isColSpinning = spinningCols[colIndex];
              return (
                <div
                  key={`col-${colIndex}`}
                  className={`flex flex-col gap-1.5 sm:gap-2 transition-all duration-300 ${
                    isColSpinning ? 'animate-[pulse_0.12s_infinite] translate-y-1' : 'translate-y-0'
                  }`}
                >
                  {Array.from({ length: ROWS }).map((_, rowIndex) => {
                    const tileKey = `${rowIndex}-${colIndex}`;
                    const symbol = grid[rowIndex][colIndex];
                    const isWinning = winningTiles.has(tileKey);

                    return (
                      <div
                        key={tileKey}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedSymbolDetail(symbol);
                        }}
                        className={`aspect-[1/1.05] rounded-xl sm:rounded-2xl p-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative select-none group ${
                          isWinning
                            ? 'scale-105 border-2 border-yellow-300 shadow-[0_0_20px_rgba(255,234,0,0.8)] z-10 animate-bounce'
                            : isColSpinning
                            ? 'border-yellow-500/40 bg-gradient-to-b from-amber-950/60 to-black/80 blur-[0.5px]'
                            : `border ${symbol.borderColor} bg-gradient-to-b ${symbol.bgColor} hover:scale-98 hover:brightness-125`
                        }`}
                        style={{
                          boxShadow: isWinning
                            ? '0 0 25px rgba(255, 199, 0, 0.9), inset 0 0 10px rgba(255, 234, 0, 0.6)'
                            : `0 2px 10px rgba(0,0,0,0.6)`,
                        }}
                      >
                        {/* Glow halo background on winning */}
                        {isWinning && (
                          <div className="absolute inset-0 bg-yellow-400/20 rounded-xl animate-pulse pointer-events-none" />
                        )}

                        {/* Symbol Icon Display */}
                        <div className="text-xl sm:text-2xl md:text-3xl filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-110">
                          {symbol.icon}
                        </div>

                        {/* Symbol Label / Multiplier tag */}
                        <span
                          className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight truncate w-full px-0.5 leading-none mt-0.5 ${
                            symbol.type === 'multiplier'
                              ? 'text-yellow-200 bg-black/60 px-1 py-0.5 rounded-full border border-yellow-400'
                              : symbol.color
                          }`}
                        >
                          {symbol.type === 'multiplier'
                            ? `${symbol.multiplierValue}X BOOST`
                            : symbol.name.split(' ')[0]}
                        </span>

                        {/* Mini Payout Rate pill */}
                        {symbol.type !== 'multiplier' && (
                          <span className="text-[7px] text-gray-400 font-mono scale-90">
                            {symbol.payout}x
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. BET CONTROLS & CHIPS */}
        <div className="bg-[#0F1424] border border-gray-800 rounded-2xl p-3 space-y-2.5">
          {/* Bet Selector Header */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-300">
            <span className="flex items-center gap-1.5">
              <DollarSign size={14} className="text-[#FFC700]" />
              <span>বেট পরিমাণ (Bet Amount):</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">বর্তমান বেট:</span>
              <span className="text-sm font-black font-mono text-[#FFC700]">
                ৳{betAmount} BDT
              </span>
            </div>
          </div>

          {/* Quick Select Chips */}
          <div className="grid grid-cols-7 gap-1">
            {betOptions.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setBetAmount(amount);
                }}
                disabled={isSpinning}
                className={`py-1.5 rounded-lg text-[10px] sm:text-xs font-black font-mono transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                  betAmount === amount
                    ? 'bg-gradient-to-r from-[#FFC700] to-yellow-400 text-black shadow-[0_0_10px_rgba(255,199,0,0.4)] border border-yellow-200'
                    : 'bg-[#151C30] hover:bg-[#1C2640] text-gray-300 border border-gray-700'
                }`}
              >
                ৳{amount}
              </button>
            ))}
          </div>

          {/* Helper Stats: Last Win & Auto Spin Options */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-800/80 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">সর্বশেষ জয়:</span>
              <span
                className={`font-black font-mono ${
                  lastWinAmount > 0 ? 'text-emerald-400 text-xs' : 'text-gray-500'
                }`}
              >
                {lastWinAmount > 0 ? `+৳${lastWinAmount.toLocaleString()} BDT` : '০ BDT'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Turbo Mode */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setTurboMode(!turboMode);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition ${
                  turboMode
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-[#151C30] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                <Zap size={11} />
                <span>টার্বো</span>
              </button>

              {/* Auto Spin Toggle */}
              <button
                type="button"
                onClick={toggleAutoSpin}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition ${
                  autoSpin
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-[#151C30] text-gray-300 hover:text-[#FFC700] border border-gray-700'
                }`}
              >
                <RotateCcw size={11} className={autoSpin ? 'animate-spin' : ''} />
                <span>{autoSpin ? 'অটো স্পিন বন্ধ' : 'অটো স্পিন'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM CONTROLS: Glowing SPIN / WITHDRAW Button */}
      <div className="relative z-20 p-3 sm:p-4 bg-gradient-to-t from-[#080B12] via-[#0E1322] to-[#12182B] border-t border-[#FFC700]/30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Main Action 1: Glowing Golden SPIN Button */}
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 relative overflow-hidden shadow-[0_0_25px_rgba(255,199,0,0.45)] cursor-pointer active:scale-98 disabled:opacity-60 ${
              isSpinning
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FFC700] via-yellow-400 to-[#FFB700] hover:brightness-110 text-black border-2 border-yellow-200'
            }`}
          >
            {/* Ambient Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

            {isSpinning ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>রিল ঘুরছে... (SPINNING)</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]">
                <Sparkles size={18} className="stroke-[2.5]" />
                <span>স্পিন করুন (SPIN ৳{betAmount})</span>
              </span>
            )}
          </button>

          {/* Main Action 2: Instant WITHDRAW Winnings Button */}
          <button
            type="button"
            onClick={handleWithdrawWinnings}
            disabled={gameWinnings <= 0 || isWithdrawing || isSpinning}
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 border cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed ${
              gameWinnings > 0
                ? 'bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 hover:brightness-110 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-[pulse_2s_infinite]'
                : 'bg-[#151C2C] text-gray-400 border-gray-700'
            }`}
          >
            {isWithdrawing ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>ক্যাশআউট হচ্ছে...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <DollarSign size={16} className="stroke-[2.5]" />
                <span>উইথড্র উইনিংস (WITHDRAW ৳{gameWinnings.toLocaleString()})</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 7. BIG WIN CELEBRATION MODAL POPUP */}
      {bigWinOverlay?.show && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-sm bg-gradient-to-b from-amber-900 via-yellow-950 to-black border-2 border-yellow-300 rounded-3xl p-6 text-center space-y-3 shadow-[0_0_60px_rgba(255,215,0,0.8)] relative overflow-hidden">
            <div className="text-5xl animate-bounce">👑</div>
            <h3 className="text-xl font-black italic text-yellow-300 tracking-wider">
              {bigWinOverlay.title}
            </h3>
            <div className="bg-black/70 border border-yellow-400/80 rounded-2xl py-3 px-4 shadow-inner">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">
                মোট পুরষ্কার (TOTAL PRIZE)
              </span>
              <p className="text-3xl font-black font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]">
                +৳{bigWinOverlay.amount.toLocaleString()} BDT
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBigWinOverlay(null)}
              className="w-full bg-[#FFC700] hover:bg-yellow-400 text-black font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              চালিয়ে যান (CONTINUE)
            </button>
          </div>
        </div>
      )}

      {/* 8. SYMBOL LORE & PAYTABLE DETAIL MODAL */}
      {selectedSymbolDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-[#101422] border border-[#FFC700]/60 rounded-3xl p-4 text-center space-y-2.5 shadow-2xl relative">
            <button
              onClick={() => setSelectedSymbolDetail(null)}
              className="absolute top-3 right-3 p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
            <div className="text-4xl">{selectedSymbolDetail.icon}</div>
            <h4 className="text-sm font-black text-[#FFC700]">
              {selectedSymbolDetail.name} ({selectedSymbolDetail.nameBn})
            </h4>
            <p className="text-xs text-gray-300">
              {selectedSymbolDetail.type === 'multiplier'
                ? `এই বুস্টার টাইল বোর্ডে আসলে আপনার মোট লাইনের লাভকে ${selectedSymbolDetail.multiplierValue} গুণ বাড়িয়ে দেবে!`
                : `৫ কলামের ঘরে ওপর থেকে নিচে প্রতীক মিললে পে-আউট দেওয়া হবে (৪ টি প্রতীকে বেটের ${selectedSymbolDetail.payout * 3} গুণ এবং ৩ টি প্রতীকে ${selectedSymbolDetail.payout} গুণ পে-আউট)।`}
            </p>
            <button
              onClick={() => setSelectedSymbolDetail(null)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-1.5 rounded-xl text-xs"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* 9. PAYTABLE & RULES MODAL */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F1424] border border-[#FFC700]/50 rounded-3xl p-4 max-h-[85vh] overflow-y-auto no-scrollbar space-y-3 relative text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <h3 className="text-sm font-black text-[#FFC700] uppercase tracking-wider flex items-center gap-1.5">
                <Award size={15} /> 5x4 গ্রিড পে-টেবিল ও নিয়মাবলী
              </h3>
              <button
                onClick={() => setShowPaytable(false)}
                className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-gray-300">
              <div className="bg-[#0A0D18] p-2.5 rounded-xl border border-gray-800 space-y-1">
                <strong className="text-white block">🏛️ ২০ ব্লকের গ্রিড মেকানিক্স:</strong>
                <p className="text-[11px] text-gray-400">
                  ৫ কলামের ঘরে ওপর থেকে নিচে প্রতীক মিললে পে-আউট দেওয়া হবে (Wins match top-to-bottom across 5 columns)।
                </p>
              </div>

              <div className="bg-[#0A0D18] p-2.5 rounded-xl border border-gray-800 space-y-1">
                <strong className="text-white block">⚡ মাল্টিপ্লায়ার বুস্টার (2X - 50X):</strong>
                <p className="text-[11px] text-gray-400">
                  যে কোনো স্পিনে 2X, 5X, 10X, 25X বা 50X টাইলস বোর্ডে আসলে সেটির মান একত্রিত হয়ে আপনার মোট লাইন উইনিংকে বহুগুণে বৃদ্ধি করে।
                </p>
              </div>

              <div className="bg-[#0A0D18] p-2.5 rounded-xl border border-gray-800 space-y-1">
                <strong className="text-white block">🪲 গোল্ডেন স্কারাব স্ক্যাটার:</strong>
                <p className="text-[11px] text-gray-400">
                  বোর্ডের যে কোনো স্থানে ৩ টি বা তার বেশি গোল্ডেন স্কারাব আসলে ইনস্ট্যান্ট মেগা বোনাস পুরস্কার।
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPaytable(false)}
              className="w-full bg-[#FFC700] text-black font-black py-2 rounded-xl text-xs uppercase cursor-pointer"
            >
              বন্ধ করুন (CLOSE)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
