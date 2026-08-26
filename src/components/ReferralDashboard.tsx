import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  TrendingUp,
  Award,
  Share2,
  Copy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Gift,
  ShieldCheck,
  ChevronRight,
  Download,
  Info,
  Calendar,
  Flame,
  UserCheck,
  Percent,
  X,
  Wallet,
  Zap,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface ReferralDashboardProps {
  userId?: string;
  currentUser?: any;
  username?: string;
  wallet?: any;
  onClose?: () => void;
  onOpenDeposit?: () => void;
  isModal?: boolean;
}

export default function ReferralDashboard({
  userId,
  currentUser,
  username,
  wallet,
  onClose,
  onOpenDeposit,
  isModal = false,
}: ReferralDashboardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'commission_rules' | 'invited_list'>('overview');
  const [isWithdrawingCommission, setIsWithdrawingCommission] = useState(false);
  const [commissionSuccess, setCommissionSuccess] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derived user details
  const actualUserId =
    userId ||
    currentUser?._id ||
    currentUser?.id ||
    username ||
    'ROYAL99X';
  const referralCode = typeof actualUserId === 'string' && actualUserId.length > 8
    ? actualUserId.substring(0, 8).toUpperCase()
    : String(actualUserId).toUpperCase();

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shopnopuron-vip.com';
  const referralLink = `${baseUrl}/register?ref=${referralCode}`;

  // Affiliate Performance Metrics State (Mock/Calculated)
  const [stats, setStats] = useState({
    todayIncome: 4850,
    yesterdayIncome: 3620,
    totalInvites: 148,
    activeUsers: 42,
    totalEarnings: 125400,
    earningsGoal: 300000,
    withdrawableCommission: 18450,
    commissionRate: '15%',
    agentTier: 'Gold VIP Agent',
  });

  // Render QR Code onto Canvas
  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        referralLink,
        {
          width: 140,
          margin: 1.5,
          color: {
            dark: '#0B0E14',
            light: '#FFC700',
          },
        },
        (error) => {
          if (error) console.error('QR Code Generation Error:', error);
        }
      );
    }
  }, [referralLink]);

  const handleCopyLink = () => {
    sounds.playClick();
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Quick share handlers
  const shareText = `🔥 Join the #1 VIP Casino platform in Bangladesh! Register using my VIP link to get an instant ৳100 Free Bonus + 100% First Deposit Match! 🎁 Link: ${referralLink}`;

  const handleShareTelegram = () => {
    sounds.playClick();
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    sounds.playClick();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = () => {
    sounds.playClick();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  // Download QR Code
  const handleDownloadQR = () => {
    sounds.playClick();
    if (!qrCanvasRef.current) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Affiliate_QR_${referralCode}.png`;
    a.click();
  };

  // Withdraw Commission to Main Wallet
  const handleWithdrawCommission = () => {
    sounds.playClick();
    setIsWithdrawingCommission(true);

    setTimeout(() => {
      setIsWithdrawingCommission(false);
      sounds.playWin();
      setCommissionSuccess(`৳${stats.withdrawableCommission.toLocaleString()} কমিশন সফলভাবে আপনার মেইন ব্যালেন্সে ট্রান্সফার হয়েছে!`);
      setStats((prev) => ({
        ...prev,
        withdrawableCommission: 0,
      }));
      setTimeout(() => setCommissionSuccess(''), 3500);
    }, 1000);
  };

  // Calculate Progress towards 300,000 BDT Goal
  const progressPercent = Math.min(
    100,
    Math.round((stats.totalEarnings / stats.earningsGoal) * 100)
  );

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0B0E14] text-gray-100 font-sans rounded-3xl border border-[#FFC700]/30 shadow-[0_10px_40px_rgba(0,0,0,0.85)] overflow-hidden relative">
      {/* 1. Header Bar */}
      <div className="p-4 bg-gradient-to-r from-[#101522] via-[#141B2D] to-[#101522] border-b border-gray-800 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFC700] to-amber-400 text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(255,199,0,0.35)]">
            <Gift size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black italic text-[#FFC700] tracking-wider leading-none flex items-center gap-1.5">
              <span>REFER & EARN</span>
              <span className="text-[9px] not-italic px-2 py-0.5 rounded-full bg-[#FFC700]/20 text-[#FFC700] font-bold border border-[#FFC700]/40">
                VIP AFFILIATE
              </span>
            </h2>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mt-0.5">
              এফিলিয়েট ও ইনভাইট ড্যাশবোর্ড
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        {/* Commission Success Banner */}
        {commissionSuccess && (
          <div className="bg-emerald-950/90 border border-emerald-500 rounded-2xl p-3.5 text-center space-y-1 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-xs sm:text-sm">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{commissionSuccess}</span>
            </div>
          </div>
        )}

        {/* 2. Top Section: 4 Summary Cards (Today's Income, Yesterday's Income, Total Invites, Active Users) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-[#FFC700]" />
              <span>আয় ও ইউজার সামারি (Income Overview):</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">লাইভ আপডেট</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1: Today's Income */}
            <div className="bg-gradient-to-br from-[#121826] to-[#0E131F] border border-amber-500/30 rounded-2xl p-3.5 relative overflow-hidden group hover:border-[#FFC700] transition">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[11px] font-bold text-gray-300">আজকের আয় (Today)</span>
                <div className="w-6 h-6 rounded-lg bg-amber-400/10 text-[#FFC700] flex items-center justify-center">
                  <DollarSign size={13} className="stroke-[2.5]" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-[#FFC700] tracking-tight">
                ৳{stats.todayIncome.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  +18.4%
                </span>
                <span className="text-[9px] text-gray-400">গতকালের তুলনায়</span>
              </div>
            </div>

            {/* Card 2: Yesterday's Income */}
            <div className="bg-gradient-to-br from-[#121826] to-[#0E131F] border border-gray-800 rounded-2xl p-3.5 relative overflow-hidden group hover:border-gray-700 transition">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[11px] font-bold text-gray-300">গতকালের আয়</span>
                <div className="w-6 h-6 rounded-lg bg-blue-400/10 text-blue-400 flex items-center justify-center">
                  <Calendar size={13} className="stroke-[2.5]" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-gray-200 tracking-tight">
                ৳{stats.yesterdayIncome.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  +8.2%
                </span>
                <span className="text-[9px] text-gray-400">পরিশোধিত</span>
              </div>
            </div>

            {/* Card 3: Total Invites */}
            <div className="bg-gradient-to-br from-[#121826] to-[#0E131F] border border-gray-800 rounded-2xl p-3.5 relative overflow-hidden group hover:border-gray-700 transition">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[11px] font-bold text-gray-300">মোট ইনভাইট (Total)</span>
                <div className="w-6 h-6 rounded-lg bg-purple-400/10 text-purple-400 flex items-center justify-center">
                  <Users size={13} className="stroke-[2.5]" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-purple-300 tracking-tight">
                {stats.totalInvites} <span className="text-xs font-sans text-gray-400">জন</span>
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] text-gray-400">সর্বমোট নিবন্ধিত সদস্য</span>
              </div>
            </div>

            {/* Card 4: Active Users */}
            <div className="bg-gradient-to-br from-[#121826] to-[#0E131F] border border-gray-800 rounded-2xl p-3.5 relative overflow-hidden group hover:border-gray-700 transition">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[11px] font-bold text-gray-300">সক্রিয় প্লেয়ার (Active)</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                  <UserCheck size={13} className="stroke-[2.5]" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-emerald-400 tracking-tight">
                {stats.activeUsers} <span className="text-xs font-sans text-gray-400">জন</span>
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] text-emerald-400 font-semibold">বর্তমানে গেম খেলছেন</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Agent Commission Progress Banner (300,000 BDT Goal) */}
        <div className="bg-gradient-to-br from-[#151D2E] via-[#101524] to-[#0D111A] border border-[#FFC700]/40 rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-[0_4px_20px_rgba(255,199,0,0.12)]">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FFC700]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFC700] text-black flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(255,199,0,0.4)]">
                🏆
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block leading-none">
                  এজেন্ট কমিশন টার্গেট গোল
                </span>
                <span className="text-[10px] text-[#FFC700] font-bold">
                  {stats.agentTier} • {stats.commissionRate} লাইফটাইম কমিশন
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-semibold">টার্গেট গোল</span>
              <span className="text-xs font-black font-mono text-[#FFC700]">৳300,000 BDT</span>
            </div>
          </div>

          {/* Current vs Target Amount Display */}
          <div className="flex items-baseline justify-between mt-3 mb-1.5">
            <div>
              <span className="text-[10px] text-gray-400 block">বর্তমান অর্জিত আয়</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                ৳{stats.totalEarnings.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-[#FFC700] font-mono">
                {progressPercent}% কমপ্লিট
              </span>
            </div>
          </div>

          {/* Progress Bar with Glowing Checkpoints */}
          <div className="w-full bg-[#0B0E14] h-3.5 rounded-full p-0.5 border border-gray-700/80 relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#FFC700] to-yellow-300 shadow-[0_0_12px_rgba(255,199,0,0.6)] transition-all duration-1000 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
            </div>
          </div>

          {/* Milestone Checkpoint Tags */}
          <div className="grid grid-cols-3 gap-1 text-center pt-2.5 text-[9px] font-bold">
            <div className="bg-[#0B0E14]/80 border border-gray-800 rounded-lg py-1 px-1 text-gray-400">
              <span className="block text-white">৳৫০,০০০</span>
              <span className="text-emerald-400">✓ সিলভার আনলক</span>
            </div>
            <div className="bg-[#0B0E14]/80 border border-[#FFC700]/40 rounded-lg py-1 px-1 text-[#FFC700]">
              <span className="block font-black text-[#FFC700]">৳৩০০,০০০</span>
              <span className="text-amber-300">★ গোল্ড রিওয়ার্ড</span>
            </div>
            <div className="bg-[#0B0E14]/80 border border-gray-800 rounded-lg py-1 px-1 text-gray-400">
              <span className="block text-white">৳৫০০,০০০</span>
              <span className="text-purple-400">💎 ডায়মন্ড মাস্টার</span>
            </div>
          </div>

          {/* Goal Perk Callout */}
          <div className="mt-3 bg-gradient-to-r from-amber-500/15 via-[#FFC700]/10 to-transparent p-2.5 rounded-xl border border-[#FFC700]/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#FFC700] shrink-0" />
              <span className="text-[11px] text-gray-200">
                ৳৩০০,০০০ মাইলফলক পূর্ণ হলে ইনস্ট্যান্ট <strong className="text-[#FFC700]">৳১৫,০০০ এক্সট্রা ক্যাশ বোনাস</strong> পাবেন!
              </span>
            </div>
          </div>
        </div>

        {/* 4. Generated QR Code Card & Referral Link Input */}
        <div className="bg-gradient-to-br from-[#121826] to-[#0E131F] border border-[#FFC700]/30 rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Share2 size={14} className="text-[#FFC700]" />
              <span>আপনার কিউআর কোড ও রেফারেল লিংক:</span>
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              ৳১০০ বোনাস / রেফার
            </span>
          </div>

          {/* QR Code & Scan Instructions Layout */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0B0E14] border border-gray-800 rounded-2xl p-3.5">
            {/* Generated Canvas QR Code */}
            <div className="relative p-2 rounded-2xl bg-gradient-to-tr from-[#FFC700] to-yellow-300 shadow-[0_0_20px_rgba(255,199,0,0.3)] shrink-0">
              <canvas ref={qrCanvasRef} className="rounded-xl block" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-7 h-7 bg-[#0B0E14] rounded-full border-2 border-[#FFC700] flex items-center justify-center text-[10px] font-black text-[#FFC700] shadow-md">
                  👑
                </div>
              </div>
            </div>

            {/* QR Info & Download Button */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <span className="text-xs font-black text-[#FFC700] block">
                  স্ক্যান করে সরাসরি জয়েন করুন
                </span>
                <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">
                  বন্ধুরা আপনার কিউআর কোড স্ক্যান করে একাউন্ট খুললেই পাবেন প্রতি রেফারে ইনস্ট্যান্ট ক্যাশ রিওয়ার্ড।
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="bg-[#182032] hover:bg-[#222D46] text-[#FFC700] border border-[#FFC700]/40 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow"
                >
                  <Download size={13} />
                  <span>QR ডাউনলোড</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="bg-[#182032] hover:bg-[#222D46] text-white border border-gray-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Copy size={13} className="text-[#FFC700]" />
                  <span>কোড: {referralCode} ({copiedCode ? 'কপি হয়েছে!' : 'কপি'})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Copyable Referral Link Input Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
              <span>রেফারেল লিংক (Copy Referral Link):</span>
              <span className="text-[9px] text-[#FFC700] font-mono">1-Tap Instant Copy</span>
            </label>
            <div className="flex items-center gap-2 bg-[#0B0E14] border border-gray-800 focus-within:border-[#FFC700] rounded-xl p-1.5 transition">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent px-2.5 py-1.5 text-xs font-mono text-[#FFC700] outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-[#FFC700] hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition shrink-0 active:scale-95 shadow-[0_0_12px_rgba(255,199,0,0.3)] cursor-pointer"
              >
                <Copy size={13} className="stroke-[2.5]" />
                <span>{copiedLink ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
              </button>
            </div>
          </div>

          {/* 5. Quick-Share Social Buttons (Telegram, WhatsApp, Facebook) */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
              কুইক শেয়ার অপশন (Quick Share via Socials):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Telegram Button */}
              <button
                type="button"
                onClick={handleShareTelegram}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#229ED9]/20 to-[#229ED9]/10 border border-[#229ED9]/50 hover:border-[#229ED9] text-[#229ED9] text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow hover:bg-[#229ED9]/25"
              >
                <span className="text-base leading-none">✈️</span>
                <span>Telegram</span>
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#25D366]/20 to-[#25D366]/10 border border-[#25D366]/50 hover:border-[#25D366] text-[#25D366] text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow hover:bg-[#25D366]/25"
              >
                <span className="text-base leading-none">💬</span>
                <span>WhatsApp</span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={handleShareFacebook}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#1877F2]/20 to-[#1877F2]/10 border border-[#1877F2]/50 hover:border-[#1877F2] text-[#38BDF8] text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow hover:bg-[#1877F2]/25"
              >
                <span className="text-base leading-none">👥</span>
                <span>Facebook</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6. Withdrawable Commission Wallet Action */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#101524] to-amber-950/40 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">
                উত্তোলনযোগ্য কমিশন ব্যালেন্স
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                ৳{stats.withdrawableCommission.toLocaleString()} BDT
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleWithdrawCommission}
            disabled={stats.withdrawableCommission <= 0 || isWithdrawingCommission}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isWithdrawingCommission ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ট্রান্সফার হচ্ছে...
              </span>
            ) : (
              <>
                <Zap size={14} className="stroke-[2.5]" />
                <span>মেইন ওয়ালেটে ট্রান্সফার করুন</span>
              </>
            )}
          </button>
        </div>

        {/* 7. Affiliate Commission Tiers & Rules Explainer */}
        <div className="bg-[#10141F] border border-gray-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <Percent size={14} className="text-[#FFC700]" />
            <span>এফিলিয়েট কমিশন রুলস (Affiliate Earning Levels):</span>
          </div>

          <div className="space-y-2 text-[11px] text-gray-300">
            <div className="flex items-start gap-2 bg-[#0B0E14] p-2.5 rounded-xl border border-gray-800/80">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-[#FFC700] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ১
              </span>
              <div>
                <strong className="text-white">রেজিস্ট্রেশন ও ফার্স্ট ডিপোজিট বোনাস:</strong>
                <p className="text-gray-400 text-[10px] mt-0.5">
                  আপনার রেফার করা প্লেয়ার ১ম ডিপোজিট করলেই আপনি পাবেন ইনস্ট্যান্ট ৳১০০ ক্যাশ রিওয়ার্ড।
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-[#0B0E14] p-2.5 rounded-xl border border-gray-800/80">
              <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ২
              </span>
              <div>
                <strong className="text-white">১৫% লাইফটাইম রেভিনিউ শেয়ার:</strong>
                <p className="text-gray-400 text-[10px] mt-0.5">
                  আপনার সকল প্লেয়ারের যেকোনো গেমে বেট করার উপর প্রতিদিন ১৫% কমিশন স্বয়ংক্রিয়ভাবে যোগ হবে।
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-[#0B0E14] p-2.5 rounded-xl border border-gray-800/80">
              <span className="w-5 h-5 rounded-full bg-purple-400/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ৩
              </span>
              <div>
                <strong className="text-white">দৈনিক ও সাপ্তাহিক ভিআইপি স্যালারি:</strong>
                <p className="text-gray-400 text-[10px] mt-0.5">
                  সক্রিয় ৫০+ প্লেয়ার থাকলে প্রতি সপ্তাহে অতিরিক্ত ৳৫,০০০ থেকে ৳২৫,০০০ ফিক্সড এজেন্ট ভাতা।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
