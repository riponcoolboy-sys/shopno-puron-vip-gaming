import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, Gift, ShieldAlert } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BannerSliderProps {
  onPlayGame: (gameId: string) => void;
  onOpenDeposit: () => void;
  onOpenVipRewards: () => void;
}

const BANNERS = [
  {
    id: 1,
    tag: 'NEW 5x4 EGYPTIAN SLOTS',
    badge: '👑 50X MULTIPLIER',
    title: "ফারাও গোল্ড ২০ ব্লক মিনি-গেম",
    subtitle: 'ক্লিওপেট্রা, স্কারাব ও ৫০ গুণ মেগা মাল্টিপ্লায়ার রিওয়ার্ড!',
    buttonText: 'খেলুন ও জিতুন',
    action: 'play-egyptian',
    colorFrom: 'from-amber-950',
    colorTo: 'to-yellow-950',
    border: 'border-yellow-500/50',
    accentColor: 'text-yellow-300',
  },
  {
    id: 2,
    tag: 'SHOPNO PURON EXCLUSIVE',
    badge: '🚀 FAST CASHOUT',
    title: 'এভিয়েটর ২.০ • রিয়েল টাইম ক্যাশআউট',
    subtitle: 'ইনকাম করুন মুহূর্তেই • লাইভ উইথড্র ২ মিনিটে',
    buttonText: 'এখনই খেলুন',
    action: 'play-aviator',
    colorFrom: 'from-purple-950',
    colorTo: 'to-indigo-900',
    border: 'border-amber-500/40',
    accentColor: 'text-amber-300',
  },
  {
    id: 3,
    tag: '100% WELCOME BONUS',
    badge: '💰 bKash & Nagad',
    title: 'প্রথম ডিপোজিটে ১০০% ক্যাশ বোনাস ফ্রি',
    subtitle: '৳১০০০ ডিপোজিটে পাবেন মোট ৳২০০০ ব্যালেন্স!',
    buttonText: 'বোনাস ক্লেইম করুন',
    action: 'deposit',
    colorFrom: 'from-amber-950',
    colorTo: 'to-red-950',
    border: 'border-yellow-500/40',
    accentColor: 'text-yellow-300',
  },
  {
    id: 4,
    tag: 'VIP LUCKY WHEEL',
    badge: '🎁 FREE SPINS',
    title: 'দৈনিক ফ্রি স্পিন করে জিতুন ৳৫,০০০',
    subtitle: 'প্রতি ২৪ ঘণ্টায় একবার স্পিন করার সুযোগ',
    buttonText: 'হুইল ঘোরান',
    action: 'vip',
    colorFrom: 'from-emerald-950',
    colorTo: 'to-teal-950',
    border: 'border-emerald-500/40',
    accentColor: 'text-emerald-300',
  },
];

export default function BannerSlider({ onPlayGame, onOpenDeposit, onOpenVipRewards }: BannerSliderProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[currentIdx];

  const handleAction = () => {
    sounds.playClick();
    if (banner.action === 'play-egyptian') {
      onPlayGame('egyptian-slots');
    } else if (banner.action === 'play-aviator') {
      onPlayGame('aviator-2');
    } else if (banner.action === 'deposit') {
      onOpenDeposit();
    } else {
      onOpenVipRewards();
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border shadow-xl transition-all duration-500">
      <div
        className={`bg-gradient-to-r ${banner.colorFrom} via-gray-900 ${banner.colorTo} p-4 sm:p-5 ${banner.border} border relative overflow-hidden flex flex-col justify-between min-h-[140px]`}
      >
        {/* Background glow orb */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] bg-amber-400 text-black font-black px-2 py-0.5 rounded tracking-wider uppercase">
              {banner.tag}
            </span>
            <span className="text-[9px] bg-black/40 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
              {banner.badge}
            </span>
          </div>

          <h3 className={`text-lg sm:text-xl font-extrabold ${banner.accentColor} leading-tight tracking-tight`}>
            {banner.title}
          </h3>
          <p className="text-xs text-gray-200 mt-1 font-medium">{banner.subtitle}</p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <button
            onClick={handleAction}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 active:scale-95 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg transition"
          >
            <span>{banner.buttonText}</span>
            <ArrowRight size={14} />
          </button>

          {/* Dots Indicator */}
          <div className="flex gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => { sounds.playClick(); setCurrentIdx(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIdx === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
