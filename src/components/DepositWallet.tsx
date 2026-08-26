import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { PaymentGateway } from '../types';
import { sounds } from '../utils/audio';
import { sanitizeInput, secureStorage, secureFetch } from '../utils/security';

interface DepositWalletProps {
  userId?: string;
  onClose?: () => void;
  onSubmitDeposit?: (deposit: {
    paymentMethod: PaymentGateway;
    amount: number;
    transactionId: string;
    senderNumber: string;
    bonusApplied: boolean;
  }) => void;
}

export default function DepositWallet({ userId, onClose, onSubmitDeposit }: DepositWalletProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('bkash');
  const [amount, setAmount] = useState<number>(500);
  const [customAmountStr, setCustomAmountStr] = useState<string>('500');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [claimBonus, setClaimBonus] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch real-time live balance from storage or API
  useEffect(() => {
    const fetchLatestBalance = async () => {
      try {
        const storedUser =
          secureStorage.getItem<any>('aviator_user', null) ||
          secureStorage.getItem<any>('user_profile', null);
        
        const idToFetch =
          userId ||
          storedUser?._id ||
          storedUser?.id ||
          storedUser?.username ||
          (() => {
            try {
              const raw = localStorage.getItem('user') || localStorage.getItem('aviator_user');
              const parsed = raw ? JSON.parse(raw) : null;
              return parsed?.id || parsed?._id || parsed?.username || '';
            } catch {
              return '';
            }
          })();

        if (idToFetch) {
          const res = await secureFetch(`/api/user/balance/${idToFetch}`);
          const data = await res.json();
          if (data.success && data.balance !== undefined) {
            setBalance(data.balance);
            return;
          }
        }
      } catch (err) {
        // Fallback to secure storage
        try {
          const localWallet = secureStorage.getItem<any>('shopno_puron_wallet', null);
          if (localWallet && localWallet.balance !== undefined) {
            setBalance(localWallet.balance);
            return;
          }
          const rawWallet = localStorage.getItem('shopno_puron_wallet');
          if (rawWallet) {
            const parsed = JSON.parse(rawWallet);
            if (parsed.balance !== undefined) setBalance(parsed.balance);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    fetchLatestBalance();
  }, [userId]);

  // Payment gateways configuration
  const gateways: {
    id: PaymentGateway;
    name: string;
    nameBn: string;
    tag: string;
    icon: string;
    color: string;
    accentBg: string;
    badgeColor: string;
    accountNumber: string;
    accountType: string;
    instructionText: string;
  }[] = [
    {
      id: 'bkash',
      name: 'bKash',
      nameBn: 'বিকাশ',
      tag: 'INSTANT',
      icon: '🌸',
      color: 'border-[#E2136E]/60 text-[#E2136E]',
      accentBg: 'bg-[#E2136E]/15 hover:bg-[#E2136E]/25',
      badgeColor: 'bg-[#E2136E] text-white',
      accountNumber: '01865339055',
      accountType: 'Personal (Send Money)',
      instructionText: 'বিকাশ অ্যাপ থেকে "Send Money" অপশন ব্যবহার করে উপরের নম্বরে টাকা পাঠান।',
    },
    {
      id: 'nagad',
      name: 'Nagad',
      nameBn: 'নগদ',
      tag: 'POPULAR',
      icon: '🔥',
      color: 'border-[#F7941D]/60 text-[#F7941D]',
      accentBg: 'bg-[#F7941D]/15 hover:bg-[#F7941D]/25',
      badgeColor: 'bg-[#F7941D] text-white',
      accountNumber: '01865339055',
      accountType: 'Personal (Send Money)',
      instructionText: 'নগদ অ্যাপ বা *167# ডায়াল করে "Send Money" এর মাধ্যমে টাকা পাঠান।',
    },
    {
      id: 'rocket',
      name: 'Rocket',
      nameBn: 'রকেট',
      tag: 'FAST',
      icon: '🚀',
      color: 'border-[#8C3494]/60 text-[#C084FC]',
      accentBg: 'bg-[#8C3494]/15 hover:bg-[#8C3494]/25',
      badgeColor: 'bg-[#8C3494] text-white',
      accountNumber: '018653390558',
      accountType: 'Personal (Send Money)',
      instructionText: 'রকেট অ্যাপ বা *322# ডায়াল করে "Send Money" এর মাধ্যমে টাকা পাঠান।',
    },
    {
      id: 'sendmoney',
      name: 'Send Money',
      nameBn: 'সেন্ড মানি',
      tag: 'AGENT/P2P',
      icon: '⚡',
      color: 'border-[#0284C7]/60 text-[#38BDF8]',
      accentBg: 'bg-[#0284C7]/15 hover:bg-[#0284C7]/25',
      badgeColor: 'bg-[#0284C7] text-white',
      accountNumber: '01865339055',
      accountType: 'Agent Cash-In / P2P',
      instructionText: 'যেকোনো এজেন্ট বা পার্সোনাল নম্বর থেকে সরাসরি ক্যাশ-ইন অথবা সেন্ড মানি করুন।',
    },
    {
      id: 'usdt',
      name: 'USDT',
      nameBn: 'টিআরসি২০',
      tag: 'CRYPTO 0% FEE',
      icon: '🪙',
      color: 'border-[#10B981]/60 text-[#34D399]',
      accentBg: 'bg-[#10B981]/15 hover:bg-[#10B981]/25',
      badgeColor: 'bg-[#10B981] text-black font-black',
      accountNumber: 'TY89xqW7KjN4bL2p99xZv1AaM',
      accountType: 'USDT TRC20 Address (Rate: $1 = ৳125)',
      instructionText: 'Binance/TrustWallet থেকে TRC20 নেটওয়ার্কে USDT ট্রান্সফার করে TxID সাবমিট করুন।',
    },
  ];

  // Quick select amount chips as requested: (500, 1000, 3000, 5000, 10000 BDT)
  const quickAmountChips = [500, 1000, 3000, 5000, 10000];

  const currentGatewayData = gateways.find((g) => g.id === selectedGateway) || gateways[0];

  const handleCopyAccount = () => {
    sounds.playClick();
    navigator.clipboard.writeText(currentGatewayData.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChipSelect = (chipAmount: number) => {
    sounds.playClick();
    setAmount(chipAmount);
    setCustomAmountStr(chipAmount.toString());
    setErrorMessage('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmountStr(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!amount || amount < 100) {
      setErrorMessage('সর্বনিম্ন ডিপোজিট ১০০ টাকা (Min: ৳100)');
      return;
    }

    const cleanSender = sanitizeInput.phone(senderNumber);
    const cleanTrx = sanitizeInput.trxId(trxId);

    if (!cleanSender) {
      setErrorMessage('বৈধ প্রেরক নম্বর বা ওয়ালেট অ্যাকাউন্ট নাম্বার দিন');
      return;
    }

    if (!cleanTrx) {
      setErrorMessage('অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন');
      return;
    }

    setSubmitting(true);
    sounds.playClick();

    // Call submit deposit handler
    if (onSubmitDeposit) {
      onSubmitDeposit({
        paymentMethod: selectedGateway,
        amount,
        transactionId: cleanTrx,
        senderNumber: cleanSender,
        bonusApplied: claimBonus,
      });
    }

    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      sounds.playWin();

      setTimeout(() => {
        setSuccess(false);
        if (onClose) onClose();
      }, 2500);
    }, 800);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0B0E14] text-gray-100 rounded-3xl border border-[#FFC700]/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden font-sans relative">
      {/* 1. Header Bar */}
      <div className="p-4 bg-[#101522] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFC700] to-amber-300 text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(255,199,0,0.35)]">
            <Wallet size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black italic text-[#FFC700] tracking-wider leading-none">
              DEPOSIT & RECHARGE
            </h2>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mt-0.5">
              ইনস্ট্যান্ট ডিপোজিট গেটওয়ে
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Balance Pill */}
          <div className="bg-[#0B0E14] border border-[#FFC700]/30 rounded-xl px-2.5 py-1 text-right">
            <span className="text-[9px] text-gray-400 block leading-none">ব্যালেন্স</span>
            <span className="text-xs font-black text-[#FFC700] font-mono leading-none">
              ৳{loading ? '...' : balance.toLocaleString()}
            </span>
          </div>

          {onClose && (
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
        {/* Success Banner */}
        {success && (
          <div className="bg-emerald-950/90 border border-emerald-500 rounded-2xl p-4 text-center space-y-1.5 animate-in zoom-in-95">
            <div className="w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center mx-auto text-xl font-black shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              ✓
            </div>
            <h3 className="text-sm font-black text-emerald-300">
              ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে!
            </h3>
            <p className="text-xs text-gray-300">
              ৳{amount.toLocaleString()} {claimBonus ? '(+৫০% বোনাস)' : ''} মাত্র ১-৫ মিনিটে আপনার মেইন ওয়ালেটে যোগ হয়ে যাবে।
            </p>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-red-950/80 border border-red-700 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2. Top Section: Grid of Payment Gateways (bKash, Nagad, Rocket, Send Money, USDT) */}
        <div>
          <label className="text-xs font-bold text-gray-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-[#FFC700]" />
              <span>পেমেন্ট গেটওয়ে নির্বাচন করুন (Select Gateway):</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">০% ফি • অটোমেটিক</span>
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {gateways.map((gw) => {
              const isSelected = selectedGateway === gw.id;
              return (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedGateway(gw.id);
                    setErrorMessage('');
                  }}
                  className={`relative p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer group ${
                    isSelected
                      ? `bg-[#151C2C] border-[#FFC700] shadow-[0_0_15px_rgba(255,199,0,0.25)] scale-[1.03]`
                      : 'bg-[#10141F] border-gray-800/80 hover:border-gray-700 text-gray-400'
                  }`}
                >
                  {/* Gateway Logo / Emoji */}
                  <span className="text-xl group-hover:scale-110 transition">{gw.icon}</span>

                  {/* Gateway Title */}
                  <span
                    className={`text-xs font-black leading-tight ${
                      isSelected ? 'text-white' : 'text-gray-300'
                    }`}
                  >
                    {gw.name}
                  </span>

                  {/* Subtag */}
                  <span className="text-[8px] text-gray-400 font-mono -mt-0.5">{gw.nameBn}</span>

                  {/* Active Indicator dot */}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FFC700] ring-2 ring-[#0B0E14] shadow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Official Account Card with Copy Button */}
        <div className="bg-gradient-to-br from-[#121826] to-[#0D121D] border border-[#FFC700]/30 rounded-2xl p-3.5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              অফিশিয়াল {currentGatewayData.name} অ্যাকাউন্ট:
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FFC700]/10 border border-[#FFC700]/30 text-[#FFC700]">
              {currentGatewayData.accountType}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-[#0B0E14] border border-gray-800 rounded-xl px-3 py-2.5">
            <p className="text-base sm:text-lg font-black font-mono text-[#FFC700] tracking-wider truncate">
              {currentGatewayData.accountNumber}
            </p>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="bg-[#182032] hover:bg-[#202B44] text-[#FFC700] border border-[#FFC700]/40 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition shrink-0 active:scale-95 shadow"
            >
              <Copy size={13} />
              <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
            </button>
          </div>

          <p className="text-[11px] text-gray-300 leading-relaxed">
            💡 {currentGatewayData.instructionText}
          </p>
        </div>

        {/* 4. Quick-Select Amount Chips (500, 1000, 3000, 5000, 10000 BDT) & Custom Input */}
        <div>
          <label className="text-xs font-bold text-gray-300 mb-2 flex items-center justify-between">
            <span>ডিপোজিট পরিমাণ নির্বাচন করুন (Recharge Amount):</span>
            <span className="text-[10px] text-[#FFC700] font-mono">BDT (৳)</span>
          </label>

          {/* Quick-select amount chips */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2.5">
            {quickAmountChips.map((chip) => {
              const isSelected = amount === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipSelect(chip)}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-black border transition text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFC700] text-black border-[#FFC700] shadow-[0_0_12px_rgba(255,199,0,0.3)] scale-[1.02]'
                      : 'bg-[#121724] border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white'
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
              min="100"
              max="50000"
              value={customAmountStr}
              onChange={handleCustomAmountChange}
              placeholder="কাস্টম পরিমাণ লিখুন (যেমন: ৫০০, ১০০০, ৫০০০)"
              className="w-full bg-[#10141F] border border-gray-800 rounded-xl pl-8 pr-16 py-2.5 text-sm font-mono font-bold text-[#FFC700] placeholder-gray-500 focus:outline-none focus:border-[#FFC700] transition"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
              BDT
            </span>
          </div>
        </div>

        {/* 5. Sender Phone / Account Number */}
        <div>
          <label className="text-xs font-bold text-gray-300 mb-1.5 block">
            আপনার প্রেরক নম্বর / ওয়ালেট অ্যাকাউন্ট (Sender Number):
          </label>
          <input
            type="text"
            placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন (যেমন: 017XXXXXXXX)"
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            className="w-full bg-[#10141F] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC700] transition"
            required
          />
        </div>

        {/* 6. Input Box for Transaction ID (TrxID) */}
        <div>
          <label className="text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between">
            <span>ট্রানজেকশন আইডি (TrxID / Transaction ID):</span>
            <span className="text-[10px] text-gray-400 uppercase font-mono">৮-১০ ডিজিটের কোড</span>
          </label>
          <input
            type="text"
            placeholder="যেমন: BK902X88 বা 9J3K88L2"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value.toUpperCase())}
            className="w-full bg-[#10141F] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold uppercase text-[#FFC700] placeholder-gray-500 focus:outline-none focus:border-[#FFC700] transition"
            required
          />
        </div>

        {/* 7. Clear Submission Guidelines Text */}
        <div className="bg-[#10141F] border border-gray-800/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <Info size={14} className="text-[#FFC700]" />
            <span>পেমেন্ট সাবমিশন গাইডলাইন (Submission Guidelines):</span>
          </div>
          <ol className="text-[11px] text-gray-300 space-y-1.5 list-decimal pl-4 leading-relaxed">
            <li>
              আপনার নির্বাচিত অ্যাপে ({currentGatewayData.name}) প্রবেশ করে{' '}
              <strong className="text-white">"Send Money"</strong> অপশনে যান।
            </li>
            <li>
              উপরের অফিসিয়াল নম্বরে কাঙ্ক্ষিত পরিমাণ (
              <strong className="text-[#FFC700]">৳{amount.toLocaleString()}</strong>) সেন্ড করুন।
            </li>
            <li>
              টাকা পাঠানো শেষে এসএমএস বা স্টেটমেন্ট থেকে প্রাপ্ত{' '}
              <strong className="text-white">Transaction ID (TrxID)</strong> কপি করে উপরের ঘরে পেস্ট করুন।
            </li>
            <li>
              নিচের <strong className="text-emerald-400">"Proceed Payment"</strong> বাটনে ক্লিক করুন।
              ১-৫ মিনিটের মধ্যে ব্যালেন্স স্বয়ংক্রিয়ভাবে জমা হবে।
            </li>
          </ol>
        </div>

        {/* 8. 50% Welcome Bonus Toggle */}
        <label className="flex items-center gap-3 bg-gradient-to-r from-amber-950/20 to-purple-950/20 p-3 rounded-2xl border border-[#FFC700]/30 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={claimBonus}
            onChange={(e) => setClaimBonus(e.target.checked)}
            className="w-4 h-4 accent-[#FFC700] rounded"
          />
          <div className="text-xs">
            <span className="font-black text-[#FFC700] flex items-center gap-1">
              <Sparkles size={13} /> ৫০% ওয়েলকাম ক্যাশ বোনাস যোগ করুন
            </span>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ৳{amount.toLocaleString()} জমা দিলে মোট ৳
              {Math.floor(amount * 1.5).toLocaleString()} গেমিং ব্যালেন্স পাবেন!
            </p>
          </div>
        </label>

        {/* 9. Full-Width Bright Green 'Proceed Payment' Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 hover:from-emerald-400 hover:to-green-300 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-[0.98] transition transform disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              পেমেন্ট ভেরিফাই করা হচ্ছে...
            </span>
          ) : (
            <>
              <ShieldCheck size={18} className="stroke-[2.5]" />
              <span>
                Proceed Payment (৳
                {claimBonus
                  ? Math.floor(amount * 1.5).toLocaleString()
                  : amount.toLocaleString()}
                )
              </span>
              <ArrowRight size={16} className="stroke-[2.5]" />
            </>
          )}
        </button>

        {/* Security & Support Guarantee */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck size={13} />
            <span>256-Bit SSL Instant Verification</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Clock size={13} />
            <span>গড় ডিপোজিট সময়: ৬০ সেকেন্ড</span>
          </div>
        </div>
      </div>
    </div>
  );
}
