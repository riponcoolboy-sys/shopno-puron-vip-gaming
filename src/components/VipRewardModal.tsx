import React, { useState } from 'react';
import { X, Sparkles, Award, Gift, Crown, CheckCircle2, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserWallet } from '../types';
import { sounds } from '../utils/audio';

interface VipRewardModalProps {
  wallet: UserWallet;
  onClose: () => void;
  onClaimReward: (amount: number, description: string) => void;
}

const PRIZES = [
  { label: '৳১০০', amount: 100, color: '#3B82F6' },
  { label: '৳২৫০', amount: 250, color: '#10B981' },
  { label: '৳৫০০', amount: 500, color: '#F59E0B' },
  { label: '৳১,০০০', amount: 1000, color: '#8B5CF6' },
  { label: '৳২,০০০', amount: 2000, color: '#EC4899' },
  { label: '৳৫,০০০ 👑', amount: 5000, color: '#EF4444' },
];

const DAILY_STREAKS = [
  { day: 1, reward: 100, claimed: true },
  { day: 2, reward: 200, claimed: true },
  { day: 3, reward: 500, claimed: false },
  { day: 4, reward: 800, claimed: false },
  { day: 5, reward: 1200, claimed: false },
  { day: 6, reward: 2000, claimed: false },
  { day: 7, reward: 5000, claimed: false },
];

export default function VipRewardModal({
  wallet,
  onClose,
  onClaimReward,
}: VipRewardModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<typeof PRIZES[0] | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [claimedStreak, setClaimedStreak] = useState(false);

  const handleSpinDailyWheel = () => {
    if (isSpinning || hasSpunToday) return;

    sounds.playClick();
    setIsSpinning(true);
    setWonPrize(null);

    const prizeIdx = Math.floor(Math.random() * PRIZES.length);
    const chosen = PRIZES[prizeIdx];
    const segmentAngle = 360 / PRIZES.length;
    const targetRot = 360 * 5 + (360 - prizeIdx * segmentAngle - segmentAngle / 2);

    setRotation((prev) => prev + targetRot);

    let ticks = 0;
    const tickTimer = setInterval(() => {
      ticks++;
      sounds.playSpinTick();
      if (ticks > 30) clearInterval(tickTimer);
    }, 100);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(chosen);
      setHasSpunToday(true);
      sounds.playBigWin();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      onClaimReward(chosen.amount, `দৈনিক ভিআইপি হুইল রিওয়ার্ড: ${chosen.label}`);
    }, 3800);
  };

  const handleClaimStreakDay = () => {
    if (claimedStreak) return;
    sounds.playWin();
    setClaimedStreak(true);
    confetti({ particleCount: 50, spread: 60 });
    onClaimReward(500, 'দিন ৩ দৈনিক চেকিং বোনাস ৳৫০০');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#121524] border border-amber-500/40 w-full max-w-md rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-lg">
              👑
            </div>
            <div>
              <h3 className="text-base font-black text-amber-400">VIP লাকি রিওয়ার্ড সেন্টার</h3>
              <p className="text-[10px] text-amber-200/70 font-mono">ক্লাব টায়ার: VIP {wallet.vipTier}</p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* VIP Tier Card */}
        <div className="bg-gradient-to-r from-amber-950/60 via-yellow-950/40 to-amber-950/60 p-3.5 rounded-2xl border border-amber-500/40 my-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <Crown size={16} className="text-amber-400" />
              <span className="text-xs font-black text-amber-300">VIP GOLD সদস্য</span>
            </div>
            <span className="text-[10px] text-amber-400/90 font-mono font-bold">পয়েন্ট: ১২,৪৫০ / ২০,০০০</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-amber-500/30">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full w-[62%]" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 flex justify-between">
            <span>পরবর্তী ধাপ: VIP PLATINUM (ডিপোজিট ক্যাশব্যাক ৫%)</span>
            <span className="text-amber-400 font-bold">৬২%</span>
          </p>
        </div>

        {/* Daily Bonus Wheel */}
        <div className="bg-[#0a0c16] border border-gray-800 rounded-2xl p-4 flex flex-col items-center mb-3 relative overflow-hidden">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles size={14} className="text-amber-300" /> দৈনিক ফ্রি লাকি হুইল স্পিন
          </span>

          {/* Pointer */}
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 z-10 -mb-2 filter drop-shadow-[0_2px_5px_rgba(251,191,36,0.9)]" />

          {/* Wheel Graphic */}
          <div
            className="w-48 h-48 rounded-full border-4 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.3)] relative flex items-center justify-center transition-transform duration-[3800ms] ease-[cubic-bezier(0.15,0.9,0.2,1)] my-2"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg className="w-full h-full absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              {PRIZES.map((p, i) => {
                const angle = 360 / PRIZES.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;
                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                return <path key={i} d={pathData} fill={p.color} stroke="#121524" strokeWidth="0.8" />;
              })}
            </svg>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border-2 border-white shadow-xl z-10 flex items-center justify-center text-[10px] font-black text-black">
              SPIN
            </div>
          </div>

          {wonPrize && (
            <div className="bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs px-3 py-1.5 rounded-full font-bold mt-2 animate-bounce">
              🎉 আপনি পেয়েছেন {wonPrize.label} বোনাস!
            </div>
          )}

          <button
            disabled={isSpinning || hasSpunToday}
            onClick={handleSpinDailyWheel}
            className={`mt-2 w-full py-2.5 rounded-xl text-xs font-black transition ${
              hasSpunToday
                ? 'bg-gray-800 text-gray-500 border border-gray-700'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:brightness-110 shadow-lg'
            }`}
          >
            {hasSpunToday ? 'আজকের ফ্রি স্পিন সম্পন্ন হয়েছে (আগামীকাল আবার আসুন)' : 'হুইল ঘুরিয়ে ফ্রি বোনাস নিন (SPIN NOW)'}
          </button>
        </div>

        {/* 7-Day Login Streak Box */}
        <div className="bg-[#0a0c16] border border-gray-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
              <Gift size={14} className="text-amber-400" /> ৭ দিনের ডেইলি চেক-ইন রিওয়ার্ড
            </span>
            <span className="text-[10px] text-amber-400 font-mono">দিন ৩ এর রিওয়ার্ড প্রস্তুত</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAILY_STREAKS.map((st) => (
              <div
                key={st.day}
                className={`p-1 rounded-lg text-center border flex flex-col items-center justify-between min-h-[52px] ${
                  st.claimed || (st.day === 3 && claimedStreak)
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : st.day === 3
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                    : 'bg-[#121524] border-gray-800 text-gray-500'
                }`}
              >
                <span className="text-[8px] font-mono">দিন {st.day}</span>
                <span className="text-[10px] font-bold font-mono">৳{st.reward}</span>
                {st.claimed || (st.day === 3 && claimedStreak) ? (
                  <CheckCircle2 size={10} className="text-emerald-400" />
                ) : (
                  <span className="text-[8px] opacity-75">{st.day === 3 ? 'ক্লেম' : 'লক'}</span>
                )}
              </div>
            ))}
          </div>

          <button
            disabled={claimedStreak}
            onClick={handleClaimStreakDay}
            className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              claimedStreak
                ? 'bg-gray-800 text-gray-500'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 text-black shadow-md hover:brightness-110'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{claimedStreak ? 'আজকের ৳৫০০ বোনাস ক্লেইম করা হয়েছে' : 'দিন ৩ এর ৳৫০০ বোনাস সংগ্রহ করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
