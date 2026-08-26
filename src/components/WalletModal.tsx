import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  Sparkles,
  Copy,
  Clock,
  Building2,
  AlertCircle,
  Phone,
  Zap,
  Info,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { Transaction, UserWallet, PaymentSettings, DepositRequest, PaymentGateway } from '../types';
import { sounds } from '../utils/audio';
import { sendDirectTelegramWithdrawAlert } from '../utils/telegram';

interface WalletModalProps {
  wallet: UserWallet;
  transactions: Transaction[];
  paymentSettings: PaymentSettings;
  depositRequests: DepositRequest[];
  onClose: () => void;
  onSubmitDeposit: (deposit: {
    paymentMethod: PaymentGateway;
    amount: number;
    transactionId: string;
    senderNumber: string;
    bonusApplied: boolean;
  }) => void;
  onWithdraw: (amount: number, method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay', phone: string) => boolean;
}

export default function WalletModal({
  wallet,
  transactions,
  paymentSettings,
  depositRequests,
  onClose,
  onSubmitDeposit,
  onWithdraw,
}: WalletModalProps) {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('bkash');
  const [amount, setAmount] = useState<number>(500);
  const [customAmountStr, setCustomAmountStr] = useState<string>('500');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [claimBonus, setClaimBonus] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Withdraw state
  const [withdrawMethod, setWithdrawMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay'>('bKash');
  const [withdrawPhone, setWithdrawPhone] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);

  // Payment gateways
  const gateways: {
    id: PaymentGateway;
    name: string;
    nameBn: string;
    tag: string;
    icon: string;
    color: string;
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
      badgeColor: 'bg-[#E2136E] text-white',
      accountNumber: paymentSettings.bkashNumber || '01865339055',
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
      badgeColor: 'bg-[#F7941D] text-white',
      accountNumber: paymentSettings.nagadNumber || '01865339055',
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
      badgeColor: 'bg-[#8C3494] text-white',
      accountNumber: paymentSettings.rocketNumber || '018653390558',
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
      badgeColor: 'bg-[#0284C7] text-white',
      accountNumber: paymentSettings.sendMoneyNumber || '01865339055',
      accountType: 'Agent Cash-In / P2P',
      instructionText: 'যেকোনো এজেন্ট বা পার্সোনাল নম্বর থেকে সরাসরি ক্যাশ-ইন অথবা সেন্ড মানি করুন।',
    },
    {
      id: 'usdt',
      name: 'USDT',
      nameBn: 'টিআরসি২০',
      tag: 'CRYPTO',
      icon: '🪙',
      color: 'border-[#10B981]/60 text-[#34D399]',
      badgeColor: 'bg-[#10B981] text-black font-black',
      accountNumber: paymentSettings.usdtAddress || 'TY89xqW7KjN4bL2p99xZv1AaM',
      accountType: 'TRC20 Address (Rate: $1 = ৳125)',
      instructionText: 'Binance/TrustWallet থেকে TRC20 নেটওয়ার্কে USDT ট্রান্সফার করে TxID দিন।',
    },
  ];

  // Quick select amount chips as requested: (500, 1000, 3000, 5000, 10000 BDT)
  const quickAmountChips = [500, 1000, 3000, 5000, 10000];

  const currentGateway = gateways.find((g) => g.id === selectedGateway) || gateways[0];

  const handleCopy = (text: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(text.replace(/-/g, ''));
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

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (amount < 100) {
      setErrorMessage('সর্বনিম্ন ডিপোজিট ১০০ টাকা (Min: ৳100)');
      return;
    }
    if (!senderNumber.trim()) {
      setErrorMessage('অনুগ্রহ করে প্রেরক নম্বর (Sender Number) দিন');
      return;
    }
    if (!transactionId.trim()) {
      setErrorMessage('অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) দিন');
      return;
    }

    const cleanTrx = transactionId.trim().toUpperCase();

    // Check duplicate TrxID in existing requests
    const isDuplicate = depositRequests.some(
      (r) => r.transactionId.toUpperCase() === cleanTrx && r.status !== 'rejected'
    );
    if (isDuplicate) {
      setErrorMessage('এই Transaction ID টি ইতিমধ্যে জমা দেওয়া হয়েছে!');
      return;
    }

    setSubmitting(true);
    sounds.playClick();

    onSubmitDeposit({
      paymentMethod: selectedGateway,
      amount,
      transactionId: cleanTrx,
      senderNumber: senderNumber.trim(),
      bonusApplied: claimBonus,
    });

    setTimeout(() => {
      setSubmitting(false);
      sounds.playWin();
      setSuccessMessage(
        `ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে! ৳${amount.toLocaleString()} ${
          claimBonus ? '(+৫০% বোনাস)' : ''
        } ১-৫ মিনিটে আপনার অ্যাকাউন্টে যোগ হবে।`
      );

      setTimeout(() => {
        setSuccessMessage('');
        setTab('history');
      }, 2000);
    }, 600);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (withdrawAmount < 500) {
      setErrorMessage('সর্বনিম্ন উইথড্র ৳৫০০ টাকা');
      return;
    }
    if (withdrawAmount > wallet.balance) {
      setErrorMessage('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }
    if (!withdrawPhone.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার উইথড্র নম্বর প্রদান করুন');
      return;
    }

    const success = onWithdraw(withdrawAmount, withdrawMethod, withdrawPhone);
    if (success) {
      // 💸 Direct Telegram Bot Alert
      try {
        const storedUser = localStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const username = parsedUser?.username || 'Player';
        sendDirectTelegramWithdrawAlert({
          username,
          amount: withdrawAmount,
          accountNumber: withdrawPhone,
          method: withdrawMethod,
        });
      } catch {}

      sounds.playCashout();
      setSuccessMessage(`উইথড্র রিকোয়েস্ট সফল! ৳${withdrawAmount.toLocaleString()} আপনার ${withdrawMethod} নম্বরে পাঠানো হচ্ছে।`);
      setTimeout(() => {
        setSuccessMessage('');
        setTab('history');
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0B0E14] border border-[#FFC700]/30 w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative max-h-[92vh] flex flex-col selection:bg-[#FFC700] selection:text-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 border border-[#FFC700]/40 rounded-xl flex items-center justify-center bg-[#FFC700]/15 text-[#FFC700] shadow-[0_0_15px_rgba(255,199,0,0.2)]">
              <Wallet size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black italic text-[#FFC700] leading-none">
                SHOPNO PURON ওয়ালেট
              </h3>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                মেইন ব্যালেন্স: <span className="text-emerald-400 font-bold">৳{wallet.balance.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#121724] p-1.5 rounded-2xl border border-gray-800 my-3">
          <button
            onClick={() => {
              sounds.playClick();
              setTab('deposit');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'deposit'
                ? 'bg-[#FFC700] text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle size={15} /> ডিপোজিট (Deposit)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setTab('withdraw');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'withdraw'
                ? 'bg-[#FFC700] text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle size={15} /> উইথড্র (Withdraw)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setTab('history');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'history'
                ? 'bg-[#FFC700] text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock size={15} /> হিস্ট্রি
          </button>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="mb-3 bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in zoom-in-95 duration-150">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-3 bg-red-950/80 border border-red-700 text-red-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5">
          {/* 1. DEPOSIT TAB */}
          {tab === 'deposit' && (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              {/* TOP SECTION: Grid of Payment Gateways (bKash, Nagad, Rocket, Send Money, USDT) */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap size={14} className="text-[#FFC700]" />
                    <span>পেমেন্ট গেটওয়ে নির্বাচন করুন (Payment Gateway):</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">০% ফি • অটো ভেরিফাই</span>
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
                            ? 'bg-[#151C2C] border-[#FFC700] shadow-[0_0_15px_rgba(255,199,0,0.25)] scale-[1.03]'
                            : 'bg-[#10141F] border-gray-800/80 hover:border-gray-700 text-gray-400'
                        }`}
                      >
                        <span className="text-xl group-hover:scale-110 transition">{gw.icon}</span>
                        <span
                          className={`text-xs font-black leading-tight ${
                            isSelected ? 'text-white' : 'text-gray-300'
                          }`}
                        >
                          {gw.name}
                        </span>
                        <span className="text-[8px] text-gray-400 font-mono -mt-0.5">{gw.nameBn}</span>

                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FFC700] ring-2 ring-[#0B0E14] shadow" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Official Gateway Account Box */}
              <div className="bg-gradient-to-br from-[#121826] to-[#0D121D] border border-[#FFC700]/30 rounded-2xl p-3.5 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    অফিশিয়াল {currentGateway.name} নম্বর:
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FFC700]/10 border border-[#FFC700]/30 text-[#FFC700]">
                    {currentGateway.accountType}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-[#0B0E14] border border-gray-800 rounded-xl px-3 py-2.5">
                  <p className="text-base sm:text-lg font-black font-mono text-[#FFC700] tracking-wider truncate">
                    {currentGateway.accountNumber}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentGateway.accountNumber)}
                    className="bg-[#182032] hover:bg-[#202B44] text-[#FFC700] border border-[#FFC700]/40 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition shrink-0 active:scale-95 shadow cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed">
                  💡 {currentGateway.instructionText}
                </p>
              </div>

              {/* Quick-Select Amount Chips & Custom Input */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-2 flex items-center justify-between">
                  <span>ডিপোজিট পরিমাণ (Recharge Amount):</span>
                  <span className="text-[10px] text-[#FFC700] font-mono">BDT (৳)</span>
                </label>

                {/* Chips (500, 1000, 3000, 5000, 10000 BDT) */}
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
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    BDT
                  </span>
                </div>
              </div>

              {/* Sender Number Input */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-1.5 block">
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

              {/* Transaction ID (TrxID) Input Box */}
              <div>
                <label className="text-xs text-gray-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>ট্রানজেকশন আইডি (TrxID / Transaction ID):</span>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">৮-১০ ডিজিটের কোড</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: BK902X88 বা 9J3K88L2"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                  className="w-full bg-[#10141F] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold uppercase text-[#FFC700] placeholder-gray-500 focus:outline-none focus:border-[#FFC700] transition"
                  required
                />
              </div>

              {/* Clear Submission Guidelines Text */}
              <div className="bg-[#10141F] border border-gray-800/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-white">
                  <Info size={14} className="text-[#FFC700]" />
                  <span>পেমেন্ট সাবমিশন গাইডলাইন (Submission Guidelines):</span>
                </div>
                <ol className="text-[11px] text-gray-300 space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>
                    আপনার নির্বাচিত অ্যাপে ({currentGateway.name}) প্রবেশ করে{' '}
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

              {/* 50% Welcome Bonus Checkbox */}
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

              {/* Full-Width Bright Green 'Proceed Payment' Button */}
              <button
                type="submit"
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
            </form>
          )}

          {/* 2. WITHDRAW TAB */}
          {tab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 font-bold mb-2 block">উইথড্র মাধ্যম নির্বাচন করুন:</label>
                <div className="grid grid-cols-4 gap-2">
                  {['bKash', 'Nagad', 'Rocket', 'Upay'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setWithdrawMethod(m as any);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                        withdrawMethod === m
                          ? 'border-[#FFC700] bg-[#FFC700]/15 text-white scale-[1.02] font-black'
                          : 'border-gray-800 bg-[#10141F] text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <span className="text-xs font-black">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold mb-1.5 block">
                  আপনার {withdrawMethod} পার্সোনাল নম্বর:
                </label>
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  className="w-full bg-[#10141F] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#FFC700]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>উইথড্র পরিমাণ (টাকা):</span>
                  <span className="text-[10px] text-gray-400">সর্বনিম্ন ৳৫০০ • সর্বোচ্চ ৳২৫,০০০</span>
                </label>
                <input
                  type="number"
                  min="500"
                  max={wallet.balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full bg-[#10141F] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-[#FFC700] font-bold focus:outline-none focus:border-[#FFC700]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FFC700] to-yellow-400 hover:brightness-110 text-black font-black py-3.5 rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
              >
                <span>উইথড্র রিকোয়েস্ট পাঠান (৳{withdrawAmount.toLocaleString()})</span>
              </button>
            </form>
          )}

          {/* 3. HISTORY TAB */}
          {tab === 'history' && (
            <div className="space-y-3">
              {/* Active Deposit Requests Status */}
              {depositRequests.length > 0 && (
                <div className="space-y-2 mb-4">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                    আপনার সাম্প্রতিক ডিপোজিট স্ট্যাটাস:
                  </span>
                  {depositRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#10141F] border border-gray-800/80 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#FFC700] uppercase font-mono">
                            {req.paymentMethod}
                          </span>
                          <span className="text-xs font-bold text-white">৳{req.amount.toLocaleString()}</span>
                          {req.bonusApplied && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                              +50% Bonus
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          TrxID: {req.transactionId} • {req.createdAt}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          req.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                        }`}
                      >
                        {req.status === 'approved' ? '✓ সফল' : req.status === 'rejected' ? '✗ বাতিল' : '⏳ পেন্ডিং'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Transactions History */}
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                ওয়ালেট লেনদেন হিস্ট্রি:
              </span>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-[#10141F] border border-gray-800/60 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-200 block">
                        {tx.type === 'DEPOSIT'
                          ? 'ডিপোজিট (Recharge)'
                          : tx.type === 'WITHDRAW'
                          ? 'উইথড্র'
                          : tx.type === 'WIN'
                          ? `জয়লাভ (${tx.gameTitle || 'গেম'})`
                          : 'বেট / প্লে'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{tx.timestamp}</span>
                    </div>
                    <span
                      className={`text-xs font-mono font-black ${
                        tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'VIP_BONUS'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'VIP_BONUS' ? '+' : '-'}৳
                      {tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
