import React, { useState, useEffect } from 'react';
import { apiUrl } from '../utils/security';
import {
  X,
  User,
  ShieldCheck,
  Award,
  History,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Headphones,
  Lock,
  CreditCard,
  Plus,
  Check,
  Copy,
  Wallet,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  Flame,
  Gift,
  HelpCircle,
  KeyRound,
  FileText,
  BadgePercent,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { sendDirectTelegramWithdrawAlert } from '../utils/telegram';

interface ProfileModalProps {
  isOpen?: boolean;
  onClose: () => void;
  user?: {
    _id?: string;
    id?: string;
    username?: string;
    balance?: number;
    phone?: string;
    vipLevel?: number;
    [key: string]: any;
  } | null;
  balance?: number;
  currentUser?: any;
  username?: string;
  wallet?: any;
  transactions?: any[];
  onOpenDeposit?: () => void;
  onOpenReferral?: () => void;
  onOpenRewards?: () => void;
  onOpenSupport?: () => void;
  onOpenAdmin?: () => void;
  onWithdraw?: (amount: number, method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay', phone: string) => boolean;
  onLogout?: () => void;
}

export default function ProfileModal({
  isOpen = true,
  onClose,
  user,
  balance,
  currentUser,
  username,
  wallet,
  transactions = [],
  onOpenDeposit,
  onOpenReferral,
  onOpenRewards,
  onOpenSupport,
  onOpenAdmin,
  onWithdraw,
  onLogout,
}: ProfileModalProps) {
  const initialBalance = typeof balance === 'number' ? balance : (wallet?.balance ?? user?.balance ?? 5240);
  const [currentBalance, setCurrentBalance] = useState<number>(initialBalance);
  const [profileUser, setProfileUser] = useState<any>(user || currentUser || null);
  const [activeTab, setActiveTab] = useState<'profile' | 'withdraw' | 'records'>('profile');
  const [selectedSubView, setSelectedSubView] = useState<string | null>(null);

  // Copy toast state
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState<boolean>(false);

  // E-Wallet Withdrawal Form State
  const [selectedWalletId, setSelectedWalletId] = useState<string>('bkash_1');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);
  const [customWithdrawStr, setCustomWithdrawStr] = useState<string>('1000');
  const [withdrawPin, setWithdrawPin] = useState<string>('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState<boolean>(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string>('');
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState<string>('');
  const [showAddWalletModal, setShowAddWalletModal] = useState<boolean>(false);

  // New Wallet Bind State
  const [newWalletType, setNewWalletType] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank'>('bKash');
  const [newWalletNumber, setNewWalletNumber] = useState<string>('');
  const [newAccountHolder, setNewAccountHolder] = useState<string>('');

  // Bound E-Wallets List
  const [boundWallets, setBoundWallets] = useState([
    {
      id: 'bkash_1',
      type: 'bKash',
      name: 'বিকাশ পার্সোনাল',
      number: '01865339055',
      masked: '018****9055',
      isPrimary: true,
      icon: '🌸',
      color: 'border-[#E2136E]/60 text-[#E2136E]',
      badgeBg: 'bg-[#E2136E]/15 text-[#E2136E]',
    },
    {
      id: 'nagad_1',
      type: 'Nagad',
      name: 'নগদ একাউন্ট',
      number: '01712984421',
      masked: '017****4421',
      isPrimary: false,
      icon: '🔥',
      color: 'border-[#F7941D]/60 text-[#F7941D]',
      badgeBg: 'bg-[#F7941D]/15 text-[#F7941D]',
    },
    {
      id: 'rocket_1',
      type: 'Rocket',
      name: 'রকেট ওয়ালেট',
      number: '01988231094',
      masked: '019****1094',
      isPrimary: false,
      icon: '🚀',
      color: 'border-[#8C3494]/60 text-[#C084FC]',
      badgeBg: 'bg-[#8C3494]/15 text-[#C084FC]',
    },
  ]);

  // Load user profile & sync live balance
  useEffect(() => {
    const loadUserProfile = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token') || localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const res = await fetch(apiUrl('/api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.user) {
          if (typeof data.user.balance === 'number') {
            setCurrentBalance(data.user.balance);
          }
          setProfileUser(data.user);
        }
      } catch (err) {
        console.error("Profile Fetch Error:", err);
      }
    };

    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  if (isOpen === false) return null;

  const displayUser = profileUser || user || currentUser || { username: username || 'VIP_Player', _id: '88392' };
  const usernameDisplay = displayUser?.username || username || 'VIP_Player';
  const memberId = displayUser?._id?.slice(-8).toUpperCase() || displayUser?.id?.slice(-8).toUpperCase() || 'SP982410';
  const vipLevel = displayUser?.vipLevel || 4;
  const canReturnToAdmin = Boolean(
    onOpenAdmin &&
      (displayUser?.role === 'admin' ||
        !!localStorage.getItem('isAdmin') ||
        !!localStorage.getItem('admin_token') ||
        localStorage.getItem('user_role') === 'admin' ||
        typeof window !== 'undefined' && (window as any).isAdminSession === true)
  );

  const handleRefreshBalance = async () => {
    sounds.playClick();
    setIsRefreshingBalance(true);
    try {
      const stored = localStorage.getItem('user') || localStorage.getItem('shopno_puron_wallet');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.balance !== undefined) setCurrentBalance(parsed.balance);
      }
    } catch {}
    setTimeout(() => setIsRefreshingBalance(false), 800);
  };

  const handleCopyId = () => {
    sounds.playClick();
    navigator.clipboard.writeText(memberId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Quick select amount chips for withdrawal
  const withdrawChips = [500, 1000, 3000, 5000, 10000, 25000];

  const handleChipSelect = (chipVal: number) => {
    sounds.playClick();
    setWithdrawAmount(chipVal);
    setCustomWithdrawStr(chipVal.toString());
    setWithdrawErrorMsg('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomWithdrawStr(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setWithdrawAmount(parsed);
    } else {
      setWithdrawAmount(0);
    }
  };

  // Handle Withdrawal Request
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg('');
    setWithdrawSuccessMsg('');

    if (withdrawAmount < 500) {
      setWithdrawErrorMsg('সর্বনিম্ন উইথড্র পরিমাণ ৫০০ টাকা (Min: ৳500)');
      return;
    }

    if (withdrawAmount > currentBalance) {
      setWithdrawErrorMsg('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }

    if (withdrawAmount > 50000) {
      setWithdrawErrorMsg('একক লেনদেনে সর্বোচ্চ ৫০,০০০ টাকা উইথড্র করা যাবে');
      return;
    }

    const targetWallet = boundWallets.find((w) => w.id === selectedWalletId) || boundWallets[0];

    setWithdrawSubmitting(true);
    sounds.playClick();

    if (onWithdraw) {
      onWithdraw(withdrawAmount, targetWallet.type as any, targetWallet.number);
    }

    // Direct Telegram Alert
    try {
      sendDirectTelegramWithdrawAlert({
        username: usernameDisplay,
        amount: withdrawAmount,
        accountNumber: targetWallet.number,
        method: targetWallet.type,
      });
    } catch {}

    setTimeout(() => {
      setWithdrawSubmitting(false);
      setCurrentBalance((prev) => Math.max(0, prev - withdrawAmount));
      sounds.playCashout();
      setWithdrawSuccessMsg(
        `উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে! ৳${withdrawAmount.toLocaleString()} আপনার ${targetWallet.name} (${targetWallet.masked}) এ ১-৫ মিনিটে ট্রান্সফার হবে।`
      );
      setWithdrawPin('');

      // Auto clear after 4s
      setTimeout(() => {
        setWithdrawSuccessMsg('');
      }, 5000);
    }, 1000);
  };

  // Add / Bind New E-Wallet
  const handleAddNewWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletNumber.trim() || newWalletNumber.length < 11) {
      alert('সঠিক ১১ ডিজিটের মোবাইল ব্যাংকিং নম্বর প্রদান করুন');
      return;
    }

    sounds.playClick();
    const newId = `wallet_${Date.now()}`;
    const newEntry = {
      id: newId,
      type: newWalletType,
      name: `${newWalletType} পার্সোনাল`,
      number: newWalletNumber.trim(),
      masked: `${newWalletNumber.slice(0, 3)}****${newWalletNumber.slice(-4)}`,
      isPrimary: false,
      icon: newWalletType === 'bKash' ? '🌸' : newWalletType === 'Nagad' ? '🔥' : '🚀',
      color: 'border-emerald-500/60 text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-400',
    };

    setBoundWallets((prev) => [...prev, newEntry]);
    setSelectedWalletId(newId);
    setShowAddWalletModal(false);
    setNewWalletNumber('');
    setNewAccountHolder('');
    alert('নতুন ওয়ালেট সফলভাবে যুক্ত হয়েছে!');
  };

  // 8 Grid Action Menu Items with Golden Minimal Icons
  const profileGridItems = [
    {
      id: 'rewards',
      title: 'রিওয়ার্ড সেন্টার',
      subtitle: 'Reward Center',
      icon: Gift,
      badge: '৳১০০ ফ্রি',
      badgeColor: 'bg-[#FFC700] text-black',
      action: () => {
        if (onOpenRewards) {
          sounds.playClick();
          onClose();
          onOpenRewards();
        } else {
          setSelectedSubView('rewards');
        }
      },
    },
    {
      id: 'bet_records',
      title: 'বেটিং রেকর্ড',
      subtitle: 'Betting Records',
      icon: History,
      badge: 'লাইভ',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      action: () => setSelectedSubView('bet_records'),
    },
    {
      id: 'pnl',
      title: 'লাভ ও ক্ষতি',
      subtitle: 'Profit & Loss',
      icon: TrendingUp,
      badge: '+৩২.৪%',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      action: () => setSelectedSubView('pnl'),
    },
    {
      id: 'deposit_records',
      title: 'ডিপোজিট রেকর্ড',
      subtitle: 'Deposit Records',
      icon: ArrowDownCircle,
      badge: 'হিস্ট্রি',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
      action: () => setSelectedSubView('deposit_records'),
    },
    {
      id: 'withdraw_records',
      title: 'উইথড্র রেকর্ড',
      subtitle: 'Withdraw Records',
      icon: ArrowUpCircle,
      badge: 'ইনস্ট্যান্ট',
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
      action: () => setSelectedSubView('withdraw_records'),
    },
    {
      id: 'account_details',
      title: 'অ্যাকাউন্ট বিবরণী',
      subtitle: 'Account Details',
      icon: User,
      badge: 'ভেরিফাইড',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      action: () => setSelectedSubView('account_details'),
    },
    {
      id: 'security_center',
      title: 'সিকিউরিটি সেন্টার',
      subtitle: 'Security Center',
      icon: ShieldCheck,
      badge: '2FA সুরক্ষিত',
      badgeColor: 'bg-amber-500/20 text-[#FFC700] border border-[#FFC700]/40',
      action: () => setSelectedSubView('security_center'),
    },
    {
      id: 'customer_service',
      title: 'কাস্টমার সার্ভিস',
      subtitle: 'Customer Service',
      icon: Headphones,
      badge: '২৪/৭ লাইভ',
      badgeColor: 'bg-emerald-500 text-black font-black',
      action: () => {
        if (onOpenSupport) {
          sounds.playClick();
          onClose();
          onOpenSupport();
        } else {
          setSelectedSubView('customer_service');
        }
      },
    },
  ];

  // Sample Betting Records Data
  const sampleBettingRecords = [
    { id: 'BET-901', game: 'Aviator Pro 2.0', time: 'আজ ০২:৪৫ PM', stake: 500, mult: '2.84x', win: 1420, status: 'WIN' },
    { id: 'BET-902', game: 'Fortune Gems 2', time: 'আজ ০১:১৫ PM', stake: 200, mult: '15.0x', win: 3000, status: 'WIN' },
    { id: 'BET-903', game: 'Crazy 777 Slot', time: 'গতকাল ১১:৩০ PM', stake: 1000, mult: '0.00x', win: 0, status: 'LOSS' },
    { id: 'BET-904', game: 'Dragon Tiger Live', time: 'গতকাল ০৯:১২ PM', stake: 1500, mult: '2.00x', win: 3000, status: 'WIN' },
    { id: 'BET-905', game: 'Lightning Roulette', time: '২২ আগস্ট ০৪:০০ PM', stake: 500, mult: '5.00x', win: 2500, status: 'WIN' },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 selection:bg-[#FFC700] selection:text-black">
      <div className="w-full max-w-lg bg-[#0B0E14] border border-[#FFC700]/30 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] overflow-hidden font-sans flex flex-col max-h-[92vh] relative">
        {/* 1. TOP HEADER NAVIGATION */}
        <div className="p-4 bg-gradient-to-r from-[#101522] via-[#141B2D] to-[#101522] border-b border-gray-800 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFC700] to-amber-400 text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(255,199,0,0.35)]">
              <User size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black italic text-[#FFC700] tracking-wider leading-none">
                MEMBER PROFILE & WALLET
              </h2>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mt-0.5">
                মেম্বার ড্যাশবোর্ড ও ক্যাশআউট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. SUB-VIEW HEADER (If navigating to a specific detail card) */}
        {selectedSubView && (
          <div className="bg-[#151C2C] px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedSubView(null);
              }}
              className="text-xs font-bold text-[#FFC700] hover:underline flex items-center gap-1 cursor-pointer"
            >
              ← ফিরে যান (Back to Profile)
            </button>
            <span className="text-xs font-black text-white uppercase font-mono">
              {selectedSubView.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* 3. SCROLLABLE CONTAINER */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4">
          {/* If a sub-view is active, render that sub-view */}
          {selectedSubView ? (
            <div className="space-y-4 animate-in fade-in">
              {/* SUB-VIEW 1: BETTING RECORDS */}
              {selectedSubView === 'bet_records' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <History size={14} className="text-[#FFC700]" />
                      <span>সাম্প্রতিক বেটিং রেকর্ড (Betting History):</span>
                    </h3>
                    <span className="text-[10px] text-gray-400">সর্বমোট ৫ টি গেম</span>
                  </div>

                  <div className="space-y-2">
                    {sampleBettingRecords.map((bet) => (
                      <div
                        key={bet.id}
                        className="bg-[#10141F] border border-gray-800 rounded-2xl p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{bet.game}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/15 text-[#FFC700] border border-[#FFC700]/30">
                              {bet.mult}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {bet.id} • {bet.time} • বেট: ৳{bet.stake}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs font-mono font-black ${
                              bet.status === 'WIN' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {bet.status === 'WIN' ? `+৳${bet.win.toLocaleString()}` : `-৳${bet.stake.toLocaleString()}`}
                          </span>
                          <span
                            className={`block text-[9px] font-bold uppercase ${
                              bet.status === 'WIN' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {bet.status === 'WIN' ? '✓ জয়ী' : '✗ হেরেছেন'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: PROFIT & LOSS */}
              {selectedSubView === 'pnl' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#121826] to-[#0E131F] border border-[#FFC700]/30 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      চলতি মাসের মোট প্রফিট (Net Profit)
                    </span>
                    <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
                      +৳১৮,৪৫০.০০
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                      লাভের হার (Win Rate): ৬৮.৫%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#10141F] border border-gray-800 p-3 rounded-xl">
                      <span className="text-[10px] text-gray-400 block">মোট উইনিং (Total Won)</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">৳৫৬,৯০০</span>
                    </div>
                    <div className="bg-[#10141F] border border-gray-800 p-3 rounded-xl">
                      <span className="text-[10px] text-gray-400 block">মোট বেট (Total Bets)</span>
                      <span className="text-sm font-black text-gray-200 font-mono">৳৩৮,৪৫০</span>
                    </div>
                    <div className="bg-[#10141F] border border-gray-800 p-3 rounded-xl">
                      <span className="text-[10px] text-gray-400 block">মোট ক্যাশব্যাক (Cashback)</span>
                      <span className="text-sm font-black text-[#FFC700] font-mono">৳১,৮৫০</span>
                    </div>
                    <div className="bg-[#10141F] border border-gray-800 p-3 rounded-xl">
                      <span className="text-[10px] text-gray-400 block">রেফারেল বোনাস</span>
                      <span className="text-sm font-black text-purple-400 font-mono">৳৪,২০০</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: DEPOSIT RECORDS */}
              {selectedSubView === 'deposit_records' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowDownCircle size={14} className="text-[#FFC700]" />
                    <span>ডিপোজিট হিস্ট্রি (Deposit Transactions):</span>
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: 'DP-9821', method: 'bKash', amount: 5000, trx: 'BK902X11', time: 'আজ ১২:১০ PM', status: 'COMPLETED' },
                      { id: 'DP-9820', method: 'Nagad', amount: 3000, trx: 'NG8820X2', time: 'গতকাল ০৮:৪৫ PM', status: 'COMPLETED' },
                      { id: 'DP-9819', method: 'Rocket', amount: 1000, trx: 'RK771239', time: '২২ আগস্ট ১০:১৫ AM', status: 'COMPLETED' },
                    ].map((dp) => (
                      <div key={dp.id} className="bg-[#10141F] border border-gray-800 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#FFC700] uppercase">{dp.method}</span>
                            <span className="text-xs font-bold text-white">৳{dp.amount.toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono">TrxID: {dp.trx} • {dp.time}</p>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          ✓ সফল
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 4: WITHDRAW RECORDS */}
              {selectedSubView === 'withdraw_records' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpCircle size={14} className="text-[#FFC700]" />
                    <span>উইথড্র হিস্ট্রি (Withdrawal Status):</span>
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: 'WD-4401', method: 'bKash', phone: '01865339055', amount: 3500, time: 'আজ ০১:২০ PM', status: 'COMPLETED' },
                      { id: 'WD-4400', method: 'Nagad', phone: '01712984421', amount: 5000, time: 'গতকাল ০৪:০০ PM', status: 'COMPLETED' },
                    ].map((wd) => (
                      <div key={wd.id} className="bg-[#10141F] border border-gray-800 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#FFC700] uppercase">{wd.method}</span>
                            <span className="text-xs font-bold text-white">৳{wd.amount.toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono">নম্বর: {wd.phone} • {wd.time}</p>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          ✓ পরিশোধিত
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 5: SECURITY CENTER */}
              {selectedSubView === 'security_center' && (
                <div className="space-y-3">
                  <div className="bg-[#10141F] border border-gray-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-white block">লগইন পাসওয়ার্ড (Login Password)</span>
                        <span className="text-[10px] text-gray-400">সর্বশেষ পরিবর্তন: ৩০ দিন আগে</span>
                      </div>
                      <button
                        onClick={() => alert('পাসওয়ার্ড পরিবর্তনের জন্য কাস্টমার সাপোর্টে যোগাযোগ করুন অথবা ওটিপি ভেরিফাই করুন।')}
                        className="bg-[#182032] hover:bg-[#222D46] text-[#FFC700] border border-[#FFC700]/30 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        পরিবর্তন করুন
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-white block">উইথড্রয়াল পিন (Withdrawal PIN)</span>
                        <span className="text-[10px] text-emerald-400">✓ ৪-ডিজিট সিকিউরিটি পিন সক্রিয়</span>
                      </div>
                      <button
                        onClick={() => alert('নতুন ৪-ডিজিট পিন সেট করুন')}
                        className="bg-[#182032] hover:bg-[#222D46] text-white border border-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        রিসেট পিন
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">লগইন ডিভাইস ভেরিফিকেশন</span>
                        <span className="text-[10px] text-gray-400">বর্তমান ডিভাইস: Chrome Mobile (Dhaka, BD)</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                        নিরাপদ
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 6: ACCOUNT DETAILS */}
              {selectedSubView === 'account_details' && (
                <div className="bg-[#10141F] border border-gray-800 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">ইউজারনেম:</span>
                    <span className="font-bold text-white">{usernameDisplay}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">মেম্বার আইডি (UID):</span>
                    <span className="font-mono font-bold text-[#FFC700]">#{memberId}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">ভিআইপি স্ট্যাটাস:</span>
                    <span className="font-bold text-[#FFC700]">VIP 4 (Gold Member)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">নিবন্ধিত মোবাইল:</span>
                    <span className="font-mono text-gray-200">018****9055</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-400">অ্যাকাউন্ট কারেন্সি:</span>
                    <span className="font-bold text-emerald-400">BDT (বাংলাদেশি টাকা)</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 4. TOP BANNER: User Avatar, VIP Badge, User ID, and Total Account Balance */}
              <div className="bg-gradient-to-br from-[#151D2E] via-[#101524] to-[#0D111A] border border-[#FFC700]/40 rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-[0_4px_20px_rgba(255,199,0,0.12)]">
                {/* Ambient Decorative Glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FFC700]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  {/* Avatar & User Details */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FFC700] via-amber-400 to-yellow-200 text-black flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(255,199,0,0.4)] border-2 border-yellow-300">
                        {usernameDisplay.charAt(0).toUpperCase()}
                      </div>
                      {/* VIP Crown Badge Icon */}
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0B0E14] border-2 border-[#FFC700] rounded-full flex items-center justify-center text-[10px] shadow">
                        👑
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white tracking-wide">
                          {usernameDisplay}
                        </h3>
                        {/* VIP Level Badge */}
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FFC700] to-yellow-500 text-black shadow font-mono uppercase tracking-wider">
                          VIP {vipLevel} GOLD
                        </span>
                      </div>

                      {/* User ID with 1-Tap Copy */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-gray-400 font-mono">
                          UID: <strong className="text-gray-200 font-bold">{memberId}</strong>
                        </span>
                        <button
                          onClick={handleCopyId}
                          className="text-gray-400 hover:text-[#FFC700] transition p-0.5 cursor-pointer"
                          title="Copy UID"
                        >
                          {copiedId ? (
                            <span className="text-[9px] text-emerald-400 font-bold">কপি হয়েছে!</span>
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Level Upgrade Progress indicator */}
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 block font-semibold">VIP প্রগ্রেস</span>
                    <span className="text-xs font-black text-[#FFC700] font-mono">VIP 4 → 5</span>
                  </div>
                </div>

                {/* Account Balance Box */}
                <div className="mt-4 pt-3.5 border-t border-gray-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">
                      মোট অ্যাকাউন্ট ব্যালেন্স (Total Balance):
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-black font-mono text-[#FFC700] tracking-tight">
                        ৳{currentBalance.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 font-bold">BDT</span>
                      <button
                        onClick={handleRefreshBalance}
                        className={`text-gray-400 hover:text-[#FFC700] transition ml-1 p-1 cursor-pointer ${
                          isRefreshingBalance ? 'animate-spin text-[#FFC700]' : ''
                        }`}
                        title="Refresh Balance"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {onOpenDeposit && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onClose();
                          onOpenDeposit();
                        }}
                        className="bg-gradient-to-r from-[#FFC700] to-yellow-400 hover:brightness-110 text-black font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(255,199,0,0.3)] active:scale-95 cursor-pointer"
                      >
                        <Plus size={14} className="stroke-[3]" />
                        <span>ডিপোজিট</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab('withdraw');
                      }}
                      className="bg-[#182032] hover:bg-[#222D46] text-white border border-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      <ArrowUpCircle size={14} className="text-[#FFC700]" />
                      <span>উইথড্র</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. TAB SWITCHER (Profile Hub vs E-Wallet Withdrawal) */}
              <div className="flex bg-[#121724] p-1.5 rounded-2xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('profile');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-[#FFC700] text-black shadow-md font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <User size={15} /> মেম্বার সার্ভিস হাব (Member Hub)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('withdraw');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'withdraw'
                      ? 'bg-[#FFC700] text-black shadow-md font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <CreditCard size={15} /> E-Wallet ক্যাশআউট (Withdraw)
                </button>
              </div>

              {/* TAB 1: PROFILE SERVICES & GOLDEN MINIMAL ICONS GRID */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {/* Grid section with 8 golden minimal icons */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-[#FFC700]" />
                        <span>সার্ভিস মেনু (Member Quick Services):</span>
                      </span>
                      <span className="text-[10px] text-gray-400">৮ টি ফিচার</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                      {profileGridItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={item.action}
                            className="bg-gradient-to-br from-[#121826] to-[#0E131F] border border-gray-800/90 hover:border-[#FFC700]/70 p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center text-center transition group active:scale-95 cursor-pointer hover:shadow-[0_0_15px_rgba(255,199,0,0.15)] relative overflow-hidden"
                          >
                            {/* Minimal Golden Icon Container */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FFC700]/15 to-amber-500/10 border border-[#FFC700]/40 text-[#FFC700] flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:border-[#FFC700] transition shadow">
                              <IconComponent size={20} className="stroke-[2.2]" />
                            </div>

                            {/* Bengali Title */}
                            <span className="text-[11px] font-bold text-gray-200 group-hover:text-white leading-tight block">
                              {item.title}
                            </span>

                            {/* English Subtitle */}
                            <span className="text-[8px] text-gray-400 font-mono mt-0.5 leading-none">
                              {item.subtitle}
                            </span>

                            {/* Mini Badge if present */}
                            {item.badge && (
                              <span
                                className={`text-[7px] font-black px-1.5 py-0.2 rounded-full mt-1.5 uppercase font-mono ${item.badgeColor}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* VIP Benefits & Quick Actions */}
                  <div className="bg-[#10141F] border border-gray-800 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <Award size={15} className="text-[#FFC700]" />
                        <span>ভিআইপি স্পেশাল সুবিধা (VIP Privileges)</span>
                      </span>
                      <span className="text-[10px] text-[#FFC700]">০% উইথড্রয়াল ফি</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-gray-300 pt-1 font-bold">
                      <div className="bg-[#0B0E14] p-2 rounded-xl border border-gray-800">
                        <span className="text-emerald-400 block font-mono">৳২৫০,০০০</span>
                        <span className="text-[9px] text-gray-400">দৈনিক লিমিট</span>
                      </div>
                      <div className="bg-[#0B0E14] p-2 rounded-xl border border-gray-800">
                        <span className="text-[#FFC700] block font-mono">৬০ সেকেন্ড</span>
                        <span className="text-[9px] text-gray-400">এক্সপ্রেস উইথড্র</span>
                      </div>
                      <div className="bg-[#0B0E14] p-2 rounded-xl border border-gray-800">
                        <span className="text-purple-400 block font-mono">১.৫% রিলোড</span>
                        <span className="text-[9px] text-gray-400">প্রতি উইকে বোনাস</span>
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        onClose();
                        onLogout();
                      }}
                      className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 py-3 rounded-2xl text-xs font-bold transition text-red-400 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🚪 অ্যাকাউন্ট সাইন আউট করুন (Logout)</span>
                    </button>
                  )}
                </div>
              )}

              {/* TAB 2: E-WALLET WITHDRAWAL SECTION */}
              {activeTab === 'withdraw' && (
                <div className="space-y-4">
                  {/* Withdrawal Feedback */}
                  {withdrawSuccessMsg && (
                    <div className="bg-emerald-950/90 border border-emerald-500 rounded-2xl p-4 text-center space-y-1.5 animate-in zoom-in-95">
                      <div className="w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center mx-auto text-xl font-black shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                        ✓
                      </div>
                      <h3 className="text-sm font-black text-emerald-300">
                        উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে!
                      </h3>
                      <p className="text-xs text-gray-300">{withdrawSuccessMsg}</p>
                    </div>
                  )}

                  {withdrawErrorMsg && (
                    <div className="bg-red-950/80 border border-red-700 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle size={16} className="text-red-400 shrink-0" />
                      <span>{withdrawErrorMsg}</span>
                    </div>
                  )}

                  {/* 1. Card / E-Wallet Attachment Status */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={14} className="text-[#FFC700]" />
                        <span>সংযুক্ত ওয়ালেট কার্ড (Bound E-Wallets):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setShowAddWalletModal(true);
                        }}
                        className="text-[11px] font-bold text-[#FFC700] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>+ নতুন ওয়ালেট যোগ করুন</span>
                      </button>
                    </div>

                    {/* Bound Wallets Horizontal / Grid Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {boundWallets.map((walletItem) => {
                        const isSelected = selectedWalletId === walletItem.id;
                        return (
                          <div
                            key={walletItem.id}
                            onClick={() => {
                              sounds.playClick();
                              setSelectedWalletId(walletItem.id);
                              setWithdrawErrorMsg('');
                            }}
                            className={`p-3 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                              isSelected
                                ? 'bg-[#151C2C] border-[#FFC700] shadow-[0_0_15px_rgba(255,199,0,0.25)] scale-[1.01]'
                                : 'bg-[#10141F] border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xl">{walletItem.icon}</span>
                              <span
                                className={`text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase font-mono ${
                                  isSelected ? 'bg-[#FFC700] text-black font-black' : 'bg-gray-800 text-gray-400'
                                }`}
                              >
                                {isSelected ? 'নির্বাচিত ✓' : 'সক্রিয়'}
                              </span>
                            </div>

                            <span className="text-xs font-black text-white block mt-1">
                              {walletItem.name}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#FFC700] tracking-wider block">
                              {walletItem.masked}
                            </span>

                            {walletItem.isPrimary && (
                              <span className="text-[8px] text-emerald-400 font-bold mt-0.5 block">
                                ★ প্রাইমারি একাউন্ট
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Withdrawal Payment Form */}
                  <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                    {/* Amount Selection with Quick Chips */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-gray-300 mb-2">
                        <span>উইথড্রয়াল পরিমাণ (Withdrawal Amount):</span>
                        <span className="text-[10px] text-[#FFC700] font-mono">
                          সর্বোচ্চ: ৳{currentBalance.toLocaleString()} BDT
                        </span>
                      </div>

                      {/* Quick Chips (500, 1000, 3000, 5000, 10000, 25000) */}
                      <div className="grid grid-cols-6 gap-1.5 mb-2">
                        {withdrawChips.map((chip) => {
                          const isSelected = withdrawAmount === chip;
                          return (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => handleChipSelect(chip)}
                              className={`py-2 px-0.5 rounded-xl text-[11px] font-mono font-black border transition text-center cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FFC700] text-black border-[#FFC700] shadow-[0_0_12px_rgba(255,199,0,0.3)] scale-[1.02]'
                                  : 'bg-[#121724] border-gray-800 text-gray-300 hover:border-gray-700'
                              }`}
                            >
                              ৳{chip >= 1000 ? `${chip / 1000}k` : chip}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Amount Input */}
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold font-mono text-sm">
                          ৳
                        </div>
                        <input
                          type="number"
                          min="500"
                          max={currentBalance}
                          value={customWithdrawStr}
                          onChange={handleCustomAmountChange}
                          placeholder="উইথড্র পরিমাণ লিখুন (যেমন: ১০০০, ৫০০০)"
                          className="w-full bg-[#10141F] border border-gray-800 rounded-xl pl-8 pr-16 py-2.5 text-sm font-mono font-bold text-[#FFC700] placeholder-gray-500 focus:outline-none focus:border-[#FFC700] transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setWithdrawAmount(currentBalance);
                            setCustomWithdrawStr(currentBalance.toString());
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black px-2 py-1 rounded-lg bg-[#182032] text-[#FFC700] hover:bg-[#202B44] border border-[#FFC700]/30 transition cursor-pointer"
                        >
                          সর্বোচ্চ (ALL)
                        </button>
                      </div>
                    </div>

                    {/* Transaction Security PIN */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-gray-300 mb-1.5">
                        <span>সিকিউরিটি পাসওয়ার্ড / পিন (Withdrawal PIN):</span>
                        <span className="text-[10px] text-gray-400 font-mono">৪-ডিজিট কোড</span>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="যেমন: ১২৩৪ বা আপনার ট্রানজেকশন পিন"
                          value={withdrawPin}
                          onChange={(e) => setWithdrawPin(e.target.value)}
                          className="w-full bg-[#10141F] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC700] transition tracking-widest"
                          required
                        />
                        <Lock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    {/* Daily Withdrawal Limits & Speed Info */}
                    <div className="bg-[#10141F] border border-gray-800 rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-300">
                        <span className="text-gray-400">দৈনিক বাকি উইথড্র লিমিট:</span>
                        <span className="font-mono font-bold text-emerald-400">৳২৫০,০০০ (৩/৩ বার বাকি)</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span className="text-gray-400">উইথড্রয়াল সার্ভিস ফি:</span>
                        <span className="font-mono font-bold text-[#FFC700]">৳০.০০ (০% ফ্রি VIP সুবিধা)</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span className="text-gray-400">প্রসেসিং গতি (Processing Time):</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Clock size={12} className="text-emerald-400" /> ১-৫ মিনিট (ইনস্ট্যান্ট)
                        </span>
                      </div>
                    </div>

                    {/* Full-Width Bright Gold/Green Confirm Withdrawal Button */}
                    <button
                      type="submit"
                      disabled={withdrawSubmitting || withdrawAmount < 500 || withdrawAmount > currentBalance}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 hover:from-emerald-400 hover:to-green-300 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-[0.98] transition transform disabled:opacity-60 cursor-pointer"
                    >
                      {withdrawSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          উইথড্র প্রসেসিং হচ্ছে...
                        </span>
                      ) : (
                        <>
                          <ShieldCheck size={18} className="stroke-[2.5]" />
                          <span>
                            উইথড্র নিশ্চিত করুন (৳{withdrawAmount.toLocaleString()} BDT)
                          </span>
                          <ArrowRight size={16} className="stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* 6. MODAL: ADD / BIND NEW WALLET */}
        {showAddWalletModal && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 p-4 flex items-center justify-center animate-in zoom-in-95">
            <div className="bg-[#121724] border border-[#FFC700]/40 rounded-3xl p-5 w-full max-w-sm space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <h3 className="text-sm font-black text-[#FFC700]">নতুন E-Wallet যুক্ত করুন</h3>
                <button
                  type="button"
                  onClick={() => setShowAddWalletModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddNewWallet} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">ওয়ালেট টাইপ নির্বাচন করুন:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['bKash', 'Nagad', 'Rocket'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewWalletType(t as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          newWalletType === t
                            ? 'bg-[#FFC700] text-black border-[#FFC700] font-black'
                            : 'bg-[#0B0E14] border-gray-800 text-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">মোবাইল একাউন্ট নম্বর:</label>
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={newWalletNumber}
                    onChange={(e) => setNewWalletNumber(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FFC700]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">অ্যাকাউন্ট হোল্ডারের নাম:</label>
                  <input
                    type="text"
                    placeholder="আপনার নাম (যেমন: Md. Ripon)"
                    value={newAccountHolder}
                    onChange={(e) => setNewAccountHolder(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC700]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#FFC700] hover:bg-yellow-400 text-black font-black text-xs rounded-xl transition shadow cursor-pointer mt-2"
                >
                  সংরক্ষণ ও যুক্ত করুন (Save & Bind)
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
