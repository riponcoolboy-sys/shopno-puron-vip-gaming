import React, { useState, useEffect } from 'react';
import { apiUrl } from '../utils/security';
import {
  X,
  Settings,
  ListFilter,
  CheckCircle2,
  XCircle,
  Users,
  Copy,
  Building2,
  Save,
  ShieldCheck,
  Search,
  Crown,
  Shield,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { PaymentSettings, DepositRequest, User } from '../types';
import { sounds } from '../utils/audio';

interface AdminPaymentModalProps {
  paymentSettings: PaymentSettings;
  depositRequests: DepositRequest[];
  onClose: () => void;
  onUpdatePaymentSettings: (settings: PaymentSettings) => void;
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string, reason?: string) => void;
}

export default function AdminPaymentModal({
  paymentSettings,
  depositRequests,
  onClose,
  onUpdatePaymentSettings,
  onApproveDeposit,
  onRejectDeposit,
}: AdminPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'settings' | 'users'>('requests');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Local Form state for Payment Settings (Matching mongoose schema)
  const [formSettings, setFormSettings] = useState<PaymentSettings>({
    bkashNumber: paymentSettings.bkashNumber || '01888-776655',
    nagadNumber: paymentSettings.nagadNumber || '01777-665544',
    bankAccountNumber: paymentSettings.bankAccountNumber || '102.110.45892',
    bankNameDetails: paymentSettings.bankNameDetails || 'Islami Bank Bangladesh Ltd (IBBL), Motijheel Branch',
  });

  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localDepositRequests, setLocalDepositRequests] = useState<DepositRequest[]>(depositRequests);

  useEffect(() => {
    setLocalDepositRequests(depositRequests);
  }, [depositRequests]);

  // User Management state from User model
  const [usersList, setUsersList] = useState<User[]>([
    {
      _id: 'usr_78912',
      username: 'vip_player07',
      phone: '01700123456',
      role: 'player',
      balance: 5240,
      vipTier: 'GOLD',
      points: 1250,
      createdAt: 'আজ',
    },
    {
      _id: 'usr_admin_boss',
      username: 'admin_boss',
      phone: '01888776655',
      role: 'admin',
      balance: 50000,
      vipTier: 'DIAMOND',
      points: 9999,
      createdAt: 'আজ',
    },
  ]);

  useEffect(() => {
    // Fetch users list from backend API with admin JWT token
    const token = localStorage.getItem('auth_token');
    fetch(apiUrl('/api/admin/users'), {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users)) {
          setUsersList(data.users);
        }
      })
      .catch(() => {});
  }, [activeTab]);

  const handleCopy = (text: string, id: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playWin();
    onUpdatePaymentSettings({
      ...formSettings,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const filteredRequests = localDepositRequests.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      req.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.senderNumber.includes(searchTerm) ||
      (req.userName && req.userName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = usersList.filter((u) => {
    return (
      searchTerm.trim() === '' ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const pendingCount = localDepositRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#121522] border border-gray-800 w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col selection:bg-[#fbbf24] selection:text-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 border border-[#fbbf24]/40 rounded-xl flex items-center justify-center bg-[#fbbf241a] text-[#fbbf24] shadow-sm">
              <Settings size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#fbbf24] tracking-wide">
                  এডমিন পেমেন্ট ও ইউজার কন্ট্রোল সেন্টার
                </h3>
                <span className="text-[10px] bg-red-950 text-red-400 font-mono px-2 py-0.5 rounded-full border border-red-800">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-gray-400">PaymentSettings, Deposit Requests ও User Schema পরিচালনা</p>
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
        <div className="flex bg-[#0a0c14] p-1.5 rounded-2xl border border-gray-800 my-3.5 gap-1">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('requests');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-[#fbbf24] text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ListFilter size={14} />
            <span>ডিপোজিট রিকোয়েস্ট</span>
            {pendingCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('settings');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-[#fbbf24] text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings size={14} />
            <span>পেমেন্ট নম্বর</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('users');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-[#fbbf24] text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>ইউজার তালিকা ({usersList.length})</span>
          </button>
        </div>

        {/* Success Toast */}
        {saveToast && (
          <div className="mb-3 bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in zoom-in-95 duration-150">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>PaymentSettings ডাটাবেসে সফলভাবে সেভ হয়েছে!</span>
          </div>
        )}

        {/* 1. DEPOSIT REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              {/* Status Pills */}
              <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                {[
                  { id: 'all', label: 'সকল' },
                  { id: 'pending', label: `অপেক্ষমান (${pendingCount})` },
                  { id: 'approved', label: 'অনুমোদিত' },
                  { id: 'rejected', label: 'বাতিলকৃত' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      sounds.playClick();
                      setStatusFilter(st.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      statusFilter === st.id
                        ? 'bg-[#fbbf241a] text-[#fbbf24] border-[#fbbf24]/50 font-black'
                        : 'bg-[#0a0c14] text-gray-400 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="TrxID বা নম্বর খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#fbbf24]"
                />
              </div>
            </div>

            {/* Requests List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-1">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-[#0a0c14] rounded-2xl border border-gray-800 p-6 space-y-2">
                  <span className="text-3xl">📥</span>
                  <p className="text-xs text-gray-400 font-medium">কোনো ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি</p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#0a0c14] border border-gray-800 hover:border-gray-700 rounded-2xl p-3.5 space-y-3 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black uppercase ${
                            req.paymentMethod === 'bkash'
                              ? 'bg-[#D12053]/20 text-[#E2136E] border border-[#E2136E]/40'
                              : req.paymentMethod === 'nagad'
                              ? 'bg-[#E31D26]/20 text-[#F7941D] border border-[#F7941D]/40'
                              : 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/40'
                          }`}
                        >
                          {req.paymentMethod === 'bkash' ? 'bK' : req.paymentMethod === 'nagad' ? 'NG' : 'BK'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase">{req.paymentMethod}</span>
                            <span className="text-[10px] text-gray-400 font-mono">User: {req.userName || req.userId}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-mono">
                            প্রেরক: <span className="text-gray-200 font-bold">{req.senderNumber}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          req.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : req.status === 'rejected'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
                        }`}
                      >
                        {req.status === 'approved' ? '✓ APPROVED' : req.status === 'rejected' ? '✕ REJECTED' : '⏳ PENDING'}
                      </span>
                    </div>

                    {/* Amount & TrxID details */}
                    <div className="bg-[#121522] p-2.5 rounded-xl border border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block">জমার পরিমাণ (Amount):</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono font-black text-emerald-400">
                            ৳{req.amount.toLocaleString()}
                          </span>
                          {req.bonusApplied && req.bonusAmount && (
                            <span className="text-[10px] text-amber-300 bg-[#fbbf241a] px-1.5 py-0.2 rounded border border-[#fbbf24]/30 font-bold">
                              +৳{req.bonusAmount} বোনাস
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div>
                          <span className="text-[10px] text-gray-400 block">Transaction ID:</span>
                          <span className="font-mono font-bold text-gray-200 text-xs">{req.transactionId}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(req.transactionId, req.id)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-lg text-[10px] transition"
                          title="TrxID কপি করুন"
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block">সময়:</span>
                        <span className="text-[10px] text-gray-400 font-mono">{req.createdAt}</span>
                      </div>
                    </div>

                    {/* Action buttons if status is pending */}
                    {req.status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            const depositId = String(req.id ?? req._id ?? '');
                            sounds.playWin();
                            setLocalDepositRequests((prev) =>
                              prev.map((item) =>
                                item.id === depositId || item._id === depositId
                                  ? { ...item, status: 'approved' }
                                  : item
                              )
                            );
                            onApproveDeposit(depositId);
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <CheckCircle2 size={14} />
                          <span>অনুমোদন করুন (Approve & Credit Balance)</span>
                        </button>
                        <button
                          onClick={() => {
                            const depositId = String(req.id ?? req._id ?? '');
                            sounds.playCashout();
                            onRejectDeposit(depositId, 'Invalid TrxID or Sender Mismatch');
                          }}
                          className="bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/80 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <XCircle size={14} />
                          <span>বাতিল (Reject)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. PAYMENT SETTINGS TAB (Admin Payment Numbers Schema) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
            <div className="bg-[#0a0c14] border border-gray-800 p-3.5 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-[#fbbf24] flex items-center gap-1.5">
                <ShieldCheck size={14} /> PaymentSettings Schema ডাটাবেস কনফিগারেশন
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                এখানে দেওয়া নম্বরগুলো সরাসরি ডিপোজিট পেজে প্রদর্শিত হবে। ইউজাররা এই নম্বরগুলোতে টাকা সেন্ড মানি বা
                ক্যাশ-আউট করবেন।
              </p>
            </div>

            {/* bKash Number */}
            <div>
              <label className="text-xs text-gray-300 font-bold mb-1.5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2136E]" />
                <span>বিকাশ নম্বর (bkashNumber):</span>
              </label>
              <input
                type="text"
                value={formSettings.bkashNumber}
                onChange={(e) => setFormSettings({ ...formSettings, bkashNumber: e.target.value })}
                placeholder="যেমন: 01888-776655"
                className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-[#fbbf24] focus:outline-none focus:border-[#fbbf24]"
                required
              />
            </div>

            {/* Nagad Number */}
            <div>
              <label className="text-xs text-gray-300 font-bold mb-1.5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F7941D]" />
                <span>নগদ নম্বর (nagadNumber):</span>
              </label>
              <input
                type="text"
                value={formSettings.nagadNumber}
                onChange={(e) => setFormSettings({ ...formSettings, nagadNumber: e.target.value })}
                placeholder="যেমন: 01777-665544"
                className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-[#fbbf24] focus:outline-none focus:border-[#fbbf24]"
                required
              />
            </div>

            {/* Bank Account Number */}
            <div>
              <label className="text-xs text-gray-300 font-bold mb-1.5 flex items-center gap-2">
                <Building2 size={13} className="text-indigo-400" />
                <span>ব্যাংক অ্যাকাউন্ট নম্বর (bankAccountNumber):</span>
              </label>
              <input
                type="text"
                value={formSettings.bankAccountNumber}
                onChange={(e) => setFormSettings({ ...formSettings, bankAccountNumber: e.target.value })}
                placeholder="যেমন: 102.110.45892"
                className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-[#fbbf24] focus:outline-none focus:border-[#fbbf24]"
                required
              />
            </div>

            {/* Bank Name Details */}
            <div>
              <label className="text-xs text-gray-300 font-bold mb-1.5 flex items-center gap-2">
                <Building2 size={13} className="text-indigo-400" />
                <span>ব্যাংকের নাম ও শাখা বিবরণী (bankNameDetails):</span>
              </label>
              <textarea
                rows={2}
                value={formSettings.bankNameDetails}
                onChange={(e) => setFormSettings({ ...formSettings, bankNameDetails: e.target.value })}
                placeholder="যেমন: Islami Bank Bangladesh Ltd (IBBL), Motijheel Branch, Dhaka"
                className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#fbbf24]"
                required
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full bg-[#fbbf24] hover:brightness-110 active:scale-[0.99] text-black font-black py-3 rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Save size={15} />
              <span>PaymentSettings সংরক্ষণ করুন (Save Settings)</span>
            </button>
          </form>
        )}

        {/* 3. USER MANAGEMENT TAB (User Model) */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="bg-[#0a0c14] border border-gray-800 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Users size={14} className="text-[#fbbf24]" /> User Schema রেজিস্টার্ড তালিকা
                </h4>
                <p className="text-[10px] text-gray-400">রোল ভিত্তিক এক্সেস (Player vs Admin)</p>
              </div>
              <div className="relative w-44">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="ইউজার খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#121522] border border-gray-800 rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#fbbf24]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
              {filteredUsers.map((user, idx) => (
                <div
                  key={user._id || user.id || idx}
                  className="bg-[#0a0c14] border border-gray-800 hover:border-gray-700 rounded-2xl p-3 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                        user.role === 'admin'
                          ? 'bg-purple-900/30 text-purple-400 border border-purple-500/40'
                          : 'bg-amber-500/20 text-[#fbbf24] border border-[#fbbf24]/40'
                      }`}
                    >
                      {user.role === 'admin' ? <Shield size={18} /> : <Crown size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{user.username}</span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.2 rounded-full uppercase ${
                            user.role === 'admin'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono mt-0.5">
                        <Phone size={10} className="text-gray-500" />
                        <span>{user.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">বর্তমান ব্যালেন্স:</span>
                    <span className="text-sm font-mono font-black text-emerald-400">
                      ৳{user.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Mongoose Schema Sync
          </span>
          <span>Last Updated: {paymentSettings.updatedAt || 'Just Now'}</span>
        </div>
      </div>
    </div>
  );
}
