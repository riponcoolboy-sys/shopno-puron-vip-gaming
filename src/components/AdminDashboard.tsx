import React, { useState, useEffect } from 'react';
import { apiUrl } from '../utils/security';
import {
  Shield,
  Crown,
  LogOut,
  ListFilter,
  TrendingUp,
  Users,
  Settings,
  SlidersHorizontal,
  Receipt,
  Search,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  UserCheck,
  Eye,
  Edit3,
  Sparkles,
  Percent,
  Activity,
  ChevronRight,
  X,
  Send,
} from 'lucide-react';
import {
  PaymentSettings,
  DepositRequest,
  WithdrawRequest,
  User,
  RTPConfig,
  AdminStats,
} from '../types';
import { sounds } from '../utils/audio';
import {
  getGlobalRTPConfig,
  setGlobalRTPConfig,
  resetRTPStats,
  getRTPDiagnostics,
} from '../utils/rtpManager';

interface AdminDashboardProps {
  currentUser: User;
  paymentSettings: PaymentSettings;
  depositRequests: DepositRequest[];
  onUpdatePaymentSettings: (settings: PaymentSettings) => void;
  onApproveDeposit: (depositId: string) => Promise<void> | void;
  onRejectDeposit: (depositId: string, reason?: string) => void;
  onLogout: () => void;
  onSwitchToLobby?: () => void;
}

interface TransactionLogItem {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'VIP_BONUS' | 'ADMIN_ADJUST';
  method?: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  rawStatus?: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  trxId?: string;
  userName?: string;
  userId?: string;
  accountNumber?: string;
  rejectionReason?: string;
}

export default function AdminDashboard({
  currentUser,
  paymentSettings,
  depositRequests: propDepositRequests,
  onUpdatePaymentSettings,
  onApproveDeposit: propApproveDeposit,
  onRejectDeposit: propRejectDeposit,
  onLogout,
  onSwitchToLobby,
}: AdminDashboardProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'deposits' | 'withdrawals' | 'gateways' | 'players' | 'rtp_controller' | 'transactions'
  >('deposits');

  // KPI Stats State
  const [stats, setStats] = useState<AdminStats>({
    totalDeposits: 9000,
    totalWithdrawals: 2300,
    netProfit: 6700,
    activePlayers: 3,
    pendingApprovals: 2,
    pendingDepositsCount: 1,
    pendingWithdrawalsCount: 1,
    currentRTP: 93,
    rtpMode: 'standard',
  });

  // Data States
  const [deposits, setDeposits] = useState<DepositRequest[]>(propDepositRequests);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([
    {
      id: 'wth_101',
      _id: 'wth_101',
      userId: 'usr_78912',
      userName: 'vip_player07',
      paymentMethod: 'bKash',
      amount: 1500,
      accountNumber: '01700123456',
      trxId: 'BK771092',
      status: 'approved',
      createdAt: '১০:৪৫ AM',
      updatedAt: '১০:৪৮ AM',
    },
    {
      id: 'wth_102',
      _id: 'wth_102',
      userId: 'usr_44521',
      userName: 'arif_khan99',
      paymentMethod: 'Nagad',
      amount: 800,
      accountNumber: '01811223344',
      status: 'pending',
      createdAt: '১১:২০ AM',
      updatedAt: '১১:২০ AM',
    },
  ]);

  const [players, setPlayers] = useState<User[]>([
    {
      _id: 'usr_78912',
      id: 'usr_78912',
      username: 'vip_player07',
      phone: '01700123456',
      role: 'player',
      balance: 5240,
      vipTier: 'GOLD',
      points: 1250,
      isBanned: false,
      totalDeposits: 6000,
      totalWithdrawals: 1500,
      createdAt: '২৩ ফেব্রুয়ারি ২০২৫',
    },
    {
      _id: 'usr_44521',
      id: 'usr_44521',
      username: 'arif_khan99',
      phone: '01811223344',
      role: 'player',
      balance: 1420,
      vipTier: 'SILVER',
      points: 450,
      isBanned: false,
      totalDeposits: 3000,
      totalWithdrawals: 800,
      createdAt: '২৪ ফেব্রুয়ারি ২০২৫',
    },
    {
      _id: 'usr_99812',
      id: 'usr_99812',
      username: 'shuvo_gamer',
      phone: '01911998877',
      role: 'player',
      balance: 890,
      vipTier: 'BRONZE',
      points: 180,
      isBanned: false,
      totalDeposits: 1000,
      totalWithdrawals: 0,
      createdAt: '২৪ ফেব্রুয়ারি ২০২৫',
    },
  ]);

  // Payment Settings Form
  const [gatewayForm, setGatewayForm] = useState<PaymentSettings>({
    bkashNumber: paymentSettings.bkashNumber || '01888-776655',
    nagadNumber: paymentSettings.nagadNumber || '01777-665544',
    rocketNumber: paymentSettings.rocketNumber || '01999-554433',
    sendMoneyNumber: paymentSettings.sendMoneyNumber || '01888-776655',
    usdtAddress: paymentSettings.usdtAddress || 'TK8xL9pQ2mNv5zB1cR4sW7yU6aE3dF8gH0',
    usdtNetwork: paymentSettings.usdtNetwork || 'TRC20',
    bankAccountNumber: paymentSettings.bankAccountNumber || '102.110.45892',
    bankNameDetails:
      paymentSettings.bankNameDetails || 'Islami Bank Bangladesh Ltd (IBBL), Motijheel Branch',
  });

  // RTP Controller State
  const [rtpConfig, setRtpConfig] = useState<RTPConfig>(getGlobalRTPConfig());
  const [rtpDiagnostics, setRtpDiagnostics] = useState(getRTPDiagnostics());

  // Filters & Search
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [txFilter, setTxFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'DEPOSIT' | 'WITHDRAW'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active Selections
  const [withdrawTrxInputs, setWithdrawTrxInputs] = useState<Record<string, string>>({});
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    type: 'deposit' | 'withdraw';
    id: string;
    targetName: string;
    amount: number;
    reason: string;
  } | null>(null);

  const [balanceModal, setBalanceModal] = useState<{
    isOpen: boolean;
    player: User | null;
    action: 'ADD' | 'SUBTRACT' | 'SET';
    amount: string;
    reason: string;
  }>({
    isOpen: false,
    player: null,
    action: 'ADD',
    amount: '',
    reason: '',
  });

  const [profileModal, setProfileModal] = useState<User | null>(null);

  // Notifications & UI state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`TrxID '${text}' ক্লিপবোর্ডে কপি করা হয়েছে!`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sync prop changes
  useEffect(() => {
    if (propDepositRequests && propDepositRequests.length > 0) {
      setDeposits(propDepositRequests);
    }
  }, [propDepositRequests]);

  // Fetch all live admin data from backend
  const fetchAllAdminData = async () => {
    setIsRefreshing(true);
    const token = localStorage.getItem('user_token') || localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      // 1. Stats
      const statsRes = await fetch(apiUrl('/api/admin/stats'), { headers }).then((r) => r.json()).catch(() => null);
      if (statsRes && statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }

      // 2. Deposits
      const depRes = await fetch(apiUrl('/api/deposits'), { headers }).then((r) => r.json()).catch(() => null);
      if (depRes && depRes.success && Array.isArray(depRes.deposits)) {
        setDeposits(
          depRes.deposits.map((d: any) => ({
            id: d._id || d.id,
            userId: d.userId,
            userName: d.userName,
            paymentMethod: d.paymentMethod,
            amount: d.amount,
            transactionId: d.transactionId,
            senderNumber: d.senderNumber,
            status: d.status,
            rejectionReason: d.rejectionReason,
            createdAt: d.createdAt,
          }))
        );
      }

      // 3. Withdrawals
      const wthRes = await fetch(apiUrl('/api/admin/withdrawals'), { headers }).then((r) => r.json()).catch(() => null);
      if (wthRes && wthRes.success && Array.isArray(wthRes.withdrawals)) {
        setWithdrawals(
          wthRes.withdrawals.map((w: any) => ({
            id: w._id || w.id,
            _id: w._id || w.id,
            userId: w.userId,
            userName: w.userName,
            paymentMethod: w.paymentMethod,
            amount: w.amount,
            accountNumber: w.accountNumber,
            trxId: w.trxId,
            status: w.status,
            rejectionReason: w.rejectionReason,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
          }))
        );
      }

      // 4. Players
      const usersRes = await fetch(apiUrl('/api/admin/users'), { headers }).then((r) => r.json()).catch(() => null);
      if (usersRes && usersRes.success && Array.isArray(usersRes.users)) {
        setPlayers(usersRes.users);
      }

      // 5. RTP
      const rtpRes = await fetch(apiUrl('/api/admin/rtp'), { headers }).then((r) => r.json()).catch(() => null);
      if (rtpRes && rtpRes.success) {
        if (rtpRes.config) setRtpConfig(rtpRes.config);
        if (rtpRes.diagnostics) setRtpDiagnostics(rtpRes.diagnostics);
      }
    } catch (e) {
      console.error('Admin data refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
    // Poll stats every 10 seconds for real-time live admin feel
    const interval = setInterval(fetchAllAdminData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute calculated KPI cards if server returns default
  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const approvedDepositsTotal = deposits
    .filter((d) => d.status === 'approved')
    .reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const approvedWithdrawalsTotal = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((acc, w) => acc + (Number(w.amount) || 0), 0);

  const activePlayersCount = players.filter((p) => p.role === 'player' && !p.isBanned).length;
  const netProfitCalc = approvedDepositsTotal - approvedWithdrawalsTotal;
  const totalPendingCount = pendingDeposits.length + pendingWithdrawals.length;

  // Approve Deposit Handler
  const handleApproveDeposit = async (id: string) => {
    sounds.playWin();
    setDeposits((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved', updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : d)));
    showToast('ডিপোজিট সফলভাবে অনুমোদিত হয়েছে এবং প্লেয়ার ব্যালেন্স ক্রেডিট করা হয়েছে!', 'success');

    try {
      await Promise.resolve(propApproveDeposit(id));
      await fetchAllAdminData();
    } catch {}
  };

  // Reject Deposit/Withdraw Confirm
  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    const { type, id, reason } = rejectModal;
    sounds.playClick();

    const finalReason = reason.trim() || 'অসঙ্গতিপূর্ণ ট্রানজেকশন তথ্য';
    const token = localStorage.getItem('user_token') || localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (type === 'deposit') {
      propRejectDeposit(id, finalReason);
      setDeposits((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'rejected', rejectionReason: finalReason } : d))
      );
      showToast('ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে।', 'error');

      try {
        await fetch(apiUrl('/api/admin/deposit/reject'), {
          method: 'POST',
          headers,
          body: JSON.stringify({ depositId: id, reason: finalReason }),
        });
      } catch {}
    } else {
      setWithdrawals((prev) =>
        prev.map((w) =>
          (w.id === id || w._id === id)
            ? { ...w, status: 'rejected', rejectionReason: finalReason }
            : w
        )
      );
      showToast('উইথড্র বাতিল করা হয়েছে এবং প্লেয়ারের ব্যালেন্স রিফান্ড হয়েছে।', 'error');

      try {
        await fetch(apiUrl('/api/admin/withdraw/reject'), {
          method: 'POST',
          headers,
          body: JSON.stringify({ withdrawId: id, reason: finalReason }),
        });
      } catch {}
    }

    setRejectModal(null);
    fetchAllAdminData();
  };

  // Approve Withdrawal Handler
  const handleApproveWithdrawal = async (id: string) => {
    const inputTrx = withdrawTrxInputs[id] || `TXW${Date.now().toString().slice(-6)}`;
    sounds.playWin();

    setWithdrawals((prev) =>
      prev.map((w) =>
        (w.id === id || w._id === id)
          ? { ...w, status: 'approved', trxId: inputTrx }
          : w
      )
    );
    showToast(`উইথড্র রিকোয়েস্ট সফলভাবে অনুমোদিত! TrxID: ${inputTrx}`, 'success');

    const token = localStorage.getItem('user_token') || localStorage.getItem('auth_token');
    try {
      await fetch(apiUrl('/api/admin/withdraw/approve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ withdrawId: id, trxId: inputTrx }),
      });
      fetchAllAdminData();
    } catch {}
  };

  // Payment Gateways Save
  const handleSaveGateways = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playWin();
    onUpdatePaymentSettings(gatewayForm);
    showToast('পেমেন্ট গেটওয়ে নম্বর ও বিবরণী সফলভাবে সেভ হয়েছে!', 'success');

    const token = localStorage.getItem('user_token') || localStorage.getItem('auth_token');
    try {
      await fetch(apiUrl('/api/admin/payment-settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(gatewayForm),
      });
      fetchAllAdminData();
    } catch {}
  };

  // Player Balance Edit
  const handleSaveBalanceAdjustment = async () => {
    if (!balanceModal.player || !balanceModal.amount) return;
    const num = Number(balanceModal.amount);
    if (isNaN(num) || num < 0) {
      showToast('সঠিক টাকার পরিমাণ দিন!', 'error');
      return;
    }

    sounds.playWin();
    const token = localStorage.getItem('user_token') || localStorage.getItem('auth_token');
    const pId = balanceModal.player._id || balanceModal.player.id;

    try {
      const res = await fetch(apiUrl('/api/admin/user/balance'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: pId,
          amount: num,
          action: balanceModal.action,
          reason: balanceModal.reason || 'এডমিন কর্তৃক ব্যালেন্স এডজাস্টমেন্ট',
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message, 'success');
        setPlayers((prev) =>
          prev.map((p) =>
            (p._id === pId || p.id === pId)
              ? { ...p, balance: res.user.balance }
              : p
          )
        );
      }
    } catch (e) {
      showToast('ব্যালেন্স আপডেট করতে ব্যর্থ হয়েছে।', 'error');
    }

    setBalanceModal({ isOpen: false, player: null, action: 'ADD', amount: '', reason: '' });
    fetchAllAdminData();
  };

  // Player Ban / Unban Toggle
  const handleToggleBan = async (player: User) => {
    sounds.playClick();
    const pId = player._id || player.id;
    const nextBanStatus = !player.isBanned;

    setPlayers((prev) =>
      prev.map((p) => ((p._id === pId || p.id === pId) ? { ...p, isBanned: nextBanStatus } : p))
    );

    showToast(
      nextBanStatus
        ? `${player.username}-কে ব্যান করা হয়েছে!`
        : `${player.username}-কে আনব্যান করা হয়েছে!`,
      nextBanStatus ? 'error' : 'success'
    );

    const token = localStorage.getItem('user_token') || localStorage.getItem('auth_token');
    try {
      await fetch(apiUrl('/api/admin/user/toggle-ban'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: pId, isBanned: nextBanStatus }),
      });
      fetchAllAdminData();
    } catch {}
  };

  // RTP Config Save
  const handleUpdateRTP = async (newProps: Partial<RTPConfig>) => {
    sounds.playClick();
    const updated = setGlobalRTPConfig(newProps);
    setRtpConfig(updated);
    setRtpDiagnostics(getRTPDiagnostics());
    showToast(`RTP আপডেট: ${updated.targetRtp}% (${updated.mode.toUpperCase()})`, 'info');

    const token = localStorage.getItem('user_token') || localStorage.getItem('auth_token');
    try {
      await fetch(apiUrl('/api/admin/rtp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newProps),
      });
      fetchAllAdminData();
    } catch {}
  };

  const handleResetRTPStats = async () => {
    sounds.playClick();
    resetRTPStats();
    setRtpDiagnostics(getRTPDiagnostics());
    showToast('গেম RTP পরিসংখ্যান রিসেট করা হয়েছে!', 'info');

    const token = localStorage.getItem('user_token') || localStorage.getItem('auth_token');
    try {
      await fetch(apiUrl('/api/admin/rtp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resetStats: true }),
      });
      fetchAllAdminData();
    } catch {}
  };

  const rtpDisplayProbabilities = {
    lose: 0.3,
    low: 0.6,
    medium: 0.08,
    high: 0.02,
  };

  const liveRtpValue = Number.parseFloat(
    String(rtpDiagnostics.currentCalculatedRTP ?? '93.00').replace('%', '')
  ) || 93;

  // Combine unified transactions for logs tab
  const combinedTransactions: TransactionLogItem[] = [
    ...deposits.map((d) => ({
      id: d.id || (d as any)._id || '',
      type: 'DEPOSIT' as const,
      method: d.paymentMethod,
      amount: Number(d.amount) || 0,
      status:
        d.status === 'approved'
          ? ('COMPLETED' as const)
          : d.status === 'rejected'
          ? ('FAILED' as const)
          : ('PENDING' as const),
      rawStatus: d.status,
      timestamp: d.createdAt || 'আজ',
      trxId: d.transactionId,
      userName: d.userName,
      userId: d.userId,
      accountNumber: d.senderNumber,
      rejectionReason: d.rejectionReason,
    })),
    ...withdrawals.map((w) => ({
      id: w.id || w._id || '',
      type: 'WITHDRAW' as const,
      method: w.paymentMethod,
      amount: Number(w.amount) || 0,
      status:
        w.status === 'approved'
          ? ('COMPLETED' as const)
          : w.status === 'rejected'
          ? ('FAILED' as const)
          : ('PENDING' as const),
      rawStatus: w.status,
      timestamp: w.createdAt || 'আজ',
      trxId: w.trxId || `WTH-${(w.accountNumber || '').slice(-4)}`,
      userName: w.userName,
      userId: w.userId,
      accountNumber: w.accountNumber,
      rejectionReason: w.rejectionReason,
    })),
  ].sort((a, b) => b.id.localeCompare(a.id));

  // Filtered queries
  const filteredDeposits = deposits.filter((d) => {
    const matchStatus = depositFilter === 'all' || d.status === depositFilter;
    const matchSearch =
      searchQuery === '' ||
      (d.transactionId && d.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.senderNumber && d.senderNumber.includes(searchQuery)) ||
      (d.userName && d.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchStatus = withdrawFilter === 'all' || w.status === withdrawFilter;
    const matchSearch =
      searchQuery === '' ||
      (w.accountNumber && w.accountNumber.includes(searchQuery)) ||
      (w.trxId && w.trxId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.userName && w.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const filteredPlayers = players.filter((p) => {
    return (
      searchQuery === '' ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery)) ||
      (p._id && p._id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredTransactions = combinedTransactions.filter((tx) => {
    const matchType = txTypeFilter === 'all' || tx.type === txTypeFilter;
    const matchStatus =
      txFilter === 'all' ||
      (txFilter === 'pending' && tx.status === 'PENDING') ||
      (txFilter === 'approved' && tx.status === 'COMPLETED') ||
      (txFilter === 'rejected' && tx.status === 'FAILED');
    const matchSearch =
      searchQuery === '' ||
      (tx.trxId && tx.trxId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.userName && tx.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.accountNumber && tx.accountNumber.includes(searchQuery));
    return matchType && matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* 1. TOP HEADER */}
      <header className="bg-[#0f121d] border-b border-purple-900/40 px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Admin Identity */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-950 via-purple-900 to-indigo-900 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  <Shield size={22} className="text-purple-400" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0f121d] rounded-full animate-ping" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0f121d] rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-wide bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                    ADMIN VIP CONTROL PANEL
                  </h1>
                  <span className="bg-purple-950 text-purple-300 border border-purple-600/50 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    MASTER ROOT
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>
                    এডমিন:{' '}
                    <strong className="text-purple-300 font-bold">
                      {currentUser.username || 'admin_ripon'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> লাইভ সিঙ্ক সক্রিয়
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Mobile Refresh */}
            <button
              onClick={() => {
                sounds.playClick();
                fetchAllAdminData();
              }}
              disabled={isRefreshing}
              className="sm:hidden p-2 rounded-xl bg-slate-900 border border-purple-900/50 text-purple-300"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                sounds.playClick();
                fetchAllAdminData();
              }}
              disabled={isRefreshing}
              className="bg-[#151928] border border-purple-900/60 hover:border-purple-500/60 text-purple-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 hover:bg-purple-950/40"
              title="রিয়েল-টাইম ডাটা রিফ্রেশ করুন"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-purple-400' : ''} />
              <span className="hidden md:inline">ডাটা সিঙ্ক</span>
            </button>

            {onSwitchToLobby && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onSwitchToLobby();
                }}
                className="bg-amber-950/40 border border-amber-500/50 hover:border-amber-400 text-amber-400 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 hover:bg-amber-900/30"
              >
                <Crown size={14} />
                <span>প্লেয়ার লবি</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                onLogout();
              }}
              className="bg-red-950/60 border border-red-800/80 hover:bg-red-900/70 text-red-300 px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-red-950/40"
            >
              <LogOut size={14} />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-lg ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-red-950/90 border-red-500 text-red-200'
                : 'bg-purple-950/90 border-purple-500 text-purple-200'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <XCircle size={18} className="text-red-400 shrink-0" />}
            {toastMessage.type === 'info' && <Sparkles size={18} className="text-purple-400 shrink-0" />}
            <span className="text-xs font-bold leading-relaxed">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1: Total Deposits */}
          <div className="bg-gradient-to-b from-[#131829] to-[#0d101b] border border-emerald-900/40 hover:border-emerald-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">মোট ডিপোজিট</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ArrowDownLeft size={16} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
              ৳ {approvedDepositsTotal.toLocaleString()}
            </h3>
            <p className="text-[10px] text-emerald-300/70 mt-1 flex items-center gap-1 font-medium">
              <span>{deposits.filter((d) => d.status === 'approved').length} টি সফল অনুমোদন</span>
            </p>
          </div>

          {/* Card 2: Total Withdrawals */}
          <div className="bg-gradient-to-b from-[#131829] to-[#0d101b] border border-blue-900/40 hover:border-blue-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">মোট উইথড্র</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-blue-400 tracking-tight">
              ৳ {approvedWithdrawalsTotal.toLocaleString()}
            </h3>
            <p className="text-[10px] text-blue-300/70 mt-1 flex items-center gap-1 font-medium">
              <span>{withdrawals.filter((w) => w.status === 'approved').length} টি সফল উইথড্র</span>
            </p>
          </div>

          {/* Card 3: Net Profit */}
          <div className="bg-gradient-to-b from-[#131829] to-[#0d101b] border border-purple-900/40 hover:border-purple-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">নেট প্রফিট</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <TrendingUp size={16} />
              </div>
            </div>
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${netProfitCalc >= 0 ? 'text-purple-300' : 'text-red-400'}`}>
              ৳ {netProfitCalc.toLocaleString()}
            </h3>
            <p className="text-[10px] text-purple-300/70 mt-1 flex items-center gap-1 font-medium">
              <span>হাউস মার্জিন: {Math.max(0, Math.round((netProfitCalc / (approvedDepositsTotal || 1)) * 100))}%</span>
            </p>
          </div>

          {/* Card 4: Active Players */}
          <div className="bg-gradient-to-b from-[#131829] to-[#0d101b] border border-indigo-900/40 hover:border-indigo-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">অ্যাক্টিভ প্লেয়ার</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Users size={16} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-indigo-300 tracking-tight">
              {activePlayersCount} জন
            </h3>
            <p className="text-[10px] text-indigo-300/70 mt-1 font-medium">
              <span>মোট ইউজার: {players.length} জন</span>
            </p>
          </div>

          {/* Card 5: Pending Approvals */}
          <div className="col-span-2 md:col-span-1 bg-gradient-to-b from-[#131829] to-[#0d101b] border border-amber-900/40 hover:border-amber-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">পেন্ডিং অনুমোদন</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${totalPendingCount > 0 ? 'bg-amber-500/20 border border-amber-500 text-amber-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                <Activity size={16} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
              {totalPendingCount} টি
            </h3>
            <p className="text-[10px] text-amber-300/70 mt-1 font-medium">
              <span>{pendingDeposits.length} ডিপোজিট • {pendingWithdrawals.length} উইথড্র</span>
            </p>
          </div>
        </div>

        {/* 4. NAVIGATION TABS */}
        <div className="flex bg-[#0f121d] p-1.5 rounded-2xl border border-purple-900/30 gap-1.5 overflow-x-auto shadow-xl">
          {[
            {
              id: 'deposits',
              label: 'ডিপোজিট রিকোয়েস্ট',
              icon: ListFilter,
              badge: pendingDeposits.length,
            },
            {
              id: 'withdrawals',
              label: 'উইথড্র রিকোয়েস্ট',
              icon: CreditCard,
              badge: pendingWithdrawals.length,
            },
            {
              id: 'gateways',
              label: 'পেমেন্ট গেটওয়ে নম্বর',
              icon: Settings,
            },
            {
              id: 'players',
              label: 'প্লেয়ার ম্যানেজমেন্ট',
              icon: Users,
              badge: players.length,
            },
            {
              id: 'rtp_controller',
              label: 'গেম RTP ও এলগোরিদম',
              icon: SlidersHorizontal,
            },
            {
              id: 'transactions',
              label: 'ট্রানজেকশন লগস',
              icon: Receipt,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex-1 min-w-[130px] sm:min-w-0 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-950/60 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-white text-purple-700' : 'bg-red-500 text-white animate-pulse'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 5. TAB VIEWS */}

        {/* TAB 1: DEPOSIT REQUESTS */}
        {activeTab === 'deposits' && (
          <div className="bg-[#0f121d] border border-purple-900/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'সকল' },
                  { id: 'pending', label: `অপেক্ষমান (${pendingDeposits.length})` },
                  { id: 'approved', label: 'অনুমোদিত' },
                  { id: 'rejected', label: 'বাতিলকৃত' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      sounds.playClick();
                      setDepositFilter(st.id as any);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      depositFilter === st.id
                        ? 'bg-purple-600 text-white border-purple-500 font-black'
                        : 'bg-[#07090e] text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="TrxID, প্রেরক নম্বর বা ইউজার..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredDeposits.length === 0 ? (
                <div className="text-center py-14 text-slate-500 text-xs">
                  কোনো ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি
                </div>
              ) : (
                filteredDeposits.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#07090e] border border-purple-900/20 hover:border-purple-700/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 uppercase shadow-md ${
                          req.paymentMethod?.toLowerCase().includes('bkash')
                            ? 'bg-[#d12053]/20 text-[#d12053] border border-[#d12053]/40'
                            : req.paymentMethod?.toLowerCase().includes('nagad')
                            ? 'bg-[#f7941d]/20 text-[#f7941d] border border-[#f7941d]/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {req.paymentMethod?.slice(0, 3) || 'PAY'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-white text-base">
                            ৳ {Number(req.amount).toLocaleString()}
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                              req.status === 'approved'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : req.status === 'rejected'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                            }`}
                          >
                            {req.status === 'approved'
                              ? 'অনুমোদিত'
                              : req.status === 'rejected'
                              ? 'বাতিল'
                              : 'অপেক্ষমান'}
                          </span>
                          {req.bonusApplied && (
                            <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full font-bold">
                              +৳{req.bonusAmount} বোনাস
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5 mt-1.5">
                          <span>
                            ইউজার: <strong className="text-slate-200">{req.userName || req.userId}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            প্রেরক নম্বর: <strong className="text-slate-200">{req.senderNumber}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-900/50">
                            TrxID: {req.transactionId}
                            <button
                              onClick={() => handleCopy(req.transactionId, req.id)}
                              className="hover:text-white"
                              title="কপি করুন"
                            >
                              <Copy size={12} />
                            </button>
                            {copiedId === req.id && (
                              <span className="text-[10px] text-emerald-400 font-bold">কপি!</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleApproveDeposit(req.id)}
                          className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-400 text-black font-black px-4 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                        >
                          <Check size={14} />
                          <span>এপ্রুভ করুন</span>
                        </button>
                        <button
                          onClick={() =>
                            setRejectModal({
                              isOpen: true,
                              type: 'deposit',
                              id: req.id,
                              targetName: req.userName || req.userId,
                              amount: req.amount,
                              reason: '',
                            })
                          }
                          className="flex-1 sm:flex-initial bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1"
                        >
                          <X size={14} />
                          <span>বাতিল</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WITHDRAWAL REQUESTS */}
        {activeTab === 'withdrawals' && (
          <div className="bg-[#0f121d] border border-purple-900/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'সকল' },
                  { id: 'pending', label: `অপেক্ষমান (${pendingWithdrawals.length})` },
                  { id: 'approved', label: 'অনুমোদিত' },
                  { id: 'rejected', label: 'বাতিলকৃত' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      sounds.playClick();
                      setWithdrawFilter(st.id as any);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      withdrawFilter === st.id
                        ? 'bg-purple-600 text-white border-purple-500 font-black'
                        : 'bg-[#07090e] text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="অ্যাকাউন্ট নম্বর, TrxID বা ইউজার..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Withdrawals Table / Cards */}
            <div className="space-y-3">
              {filteredWithdrawals.length === 0 ? (
                <div className="text-center py-14 text-slate-500 text-xs">
                  কোনো উইথড্র রিকোয়েস্ট পাওয়া যায়নি
                </div>
              ) : (
                filteredWithdrawals.map((wth) => {
                  const withdrawalId = wth.id || wth._id || '';

                  return (
                  <div
                    key={withdrawalId}
                    className="bg-[#07090e] border border-purple-900/20 hover:border-purple-700/40 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-sm shrink-0 uppercase shadow-md">
                        {wth.paymentMethod?.slice(0, 3) || 'WTH'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-white text-base">
                            ৳ {Number(wth.amount).toLocaleString()}
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                              wth.status === 'approved'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : wth.status === 'rejected'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                            }`}
                          >
                            {wth.status === 'approved'
                              ? 'অনুমোদিত'
                              : wth.status === 'rejected'
                              ? 'বাতিলকৃত'
                              : 'অপেক্ষমান'}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                            {wth.paymentMethod}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5 mt-1.5">
                          <span>
                            প্লেয়ার: <strong className="text-slate-200">{wth.userName || wth.userId}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            প্রাপক নম্বর:{' '}
                            <strong className="text-blue-300 font-mono">{wth.accountNumber}</strong>
                          </span>
                          {wth.trxId && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-900/50">
                                TrxID: {wth.trxId}
                                <button
                                  onClick={() => handleCopy(wth.trxId!, withdrawalId)}
                                  className="hover:text-white"
                                >
                                  <Copy size={12} />
                                </button>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions & TrxID Input */}
                    {wth.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="বিকাশ/নগদ TrxID লিখুন..."
                            value={withdrawTrxInputs[withdrawalId] || ''}
                            onChange={(e) =>
                              setWithdrawTrxInputs({
                                ...withdrawTrxInputs,
                                [withdrawalId]: e.target.value,
                              })
                            }
                            className="bg-[#121624] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-48 font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveWithdrawal(withdrawalId)}
                            className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-400 text-black font-black px-4 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                          >
                            <Check size={14} />
                            <span>টাকা পাঠান ও এপ্রুভ</span>
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({
                                isOpen: true,
                                type: 'withdraw',
                                id: withdrawalId,
                                targetName: wth.userName || wth.userId,
                                amount: wth.amount,
                                reason: '',
                              })
                            }
                            className="flex-1 sm:flex-initial bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1"
                          >
                            <X size={14} />
                            <span>রিজেক্ট ও রিফান্ড</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENT GATEWAY NUMBERS */}
        {activeTab === 'gateways' && (
          <form
            onSubmit={handleSaveGateways}
            className="bg-[#0f121d] border border-purple-900/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            <div>
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-purple-400" />
                <h3 className="text-lg font-black text-white">পেমেন্ট গেটওয়ে নম্বর ও একাউন্ট সেটিংস</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                এখানে যে নম্বর বা ওয়ালেট এড্রেস সংরক্ষণ করবেন, সকল প্লেয়াররা ডিপোজিট পেজে অটোমেটিক আপডেট দেখতে পাবে।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* bKash */}
              <div className="bg-[#07090e] border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-[#d12053] flex items-center justify-between">
                  <span>বিকাশ নম্বর (bKash Agent / Personal)</span>
                  <span className="text-[10px] bg-[#d12053]/20 px-2 py-0.5 rounded-full">বিকাশ ক্যাশ আউট/সেন্ড</span>
                </label>
                <input
                  type="text"
                  value={gatewayForm.bkashNumber}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, bkashNumber: e.target.value })}
                  placeholder="01888-776655"
                  className="w-full bg-[#121624] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d12053] font-mono"
                  required
                />
              </div>

              {/* Nagad */}
              <div className="bg-[#07090e] border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-[#f7941d] flex items-center justify-between">
                  <span>নগদ নম্বর (Nagad Agent / Personal)</span>
                  <span className="text-[10px] bg-[#f7941d]/20 px-2 py-0.5 rounded-full">নগদ ক্যাশ আউট</span>
                </label>
                <input
                  type="text"
                  value={gatewayForm.nagadNumber}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, nagadNumber: e.target.value })}
                  placeholder="01777-665544"
                  className="w-full bg-[#121624] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#f7941d] font-mono"
                  required
                />
              </div>

              {/* Rocket */}
              <div className="bg-[#07090e] border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-purple-400 flex items-center justify-between">
                  <span>রকেট নম্বর (Rocket Account)</span>
                  <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded-full">রকেট ডাচ-বাংলা</span>
                </label>
                <input
                  type="text"
                  value={gatewayForm.rocketNumber || ''}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, rocketNumber: e.target.value })}
                  placeholder="01999-554433"
                  className="w-full bg-[#121624] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Send Money Number */}
              <div className="bg-[#07090e] border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-black text-emerald-400 flex items-center justify-between">
                  <span>সেন্ড মানি নম্বর (Send Money Direct)</span>
                  <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded-full">পার্সোনাল সেন্ড</span>
                </label>
                <input
                  type="text"
                  value={gatewayForm.sendMoneyNumber || ''}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, sendMoneyNumber: e.target.value })}
                  placeholder="01888-776655"
                  className="w-full bg-[#121624] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* USDT Crypto Gateway */}
            <div className="bg-[#07090e] border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-emerald-400 flex items-center gap-2">
                  <DollarSign size={14} />
                  <span>USDT ক্রিপ্টো ডিপোজিট এড্রেস</span>
                </label>
                <select
                  value={gatewayForm.usdtNetwork || 'TRC20'}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, usdtNetwork: e.target.value })}
                  className="bg-[#121624] border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                >
                  <option value="TRC20">TRC20 (Tron)</option>
                  <option value="BEP20">BEP20 (BNB Smart Chain)</option>
                  <option value="ERC20">ERC20 (Ethereum)</option>
                </select>
              </div>
              <input
                type="text"
                value={gatewayForm.usdtAddress || ''}
                onChange={(e) => setGatewayForm({ ...gatewayForm, usdtAddress: e.target.value })}
                placeholder="TK8xL9pQ2mNv5zB1cR4sW7yU6aE3dF8gH0"
                className="w-full bg-[#121624] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Bank Transfer Details */}
            <div className="bg-[#07090e] border border-slate-800/80 rounded-2xl p-4 space-y-4">
              <div>
                <label className="text-xs font-black text-indigo-400 block mb-1">
                  ব্যাংক একাউন্ট নম্বর (Bank Account Number)
                </label>
                <input
                  type="text"
                  value={gatewayForm.bankAccountNumber}
                  onChange={(e) =>
                    setGatewayForm({ ...gatewayForm, bankAccountNumber: e.target.value })
                  }
                  placeholder="102.110.45892"
                  className="w-full bg-[#121624] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">
                  ব্যাংকের নাম, শাখা ও রাউটিং বিবরণী (Bank & Branch Details)
                </label>
                <input
                  type="text"
                  value={gatewayForm.bankNameDetails}
                  onChange={(e) =>
                    setGatewayForm({ ...gatewayForm, bankNameDetails: e.target.value })
                  }
                  placeholder="Islami Bank Bangladesh Ltd (IBBL), Motijheel Branch"
                  className="w-full bg-[#121624] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-8 py-3.5 rounded-2xl text-sm transition flex items-center gap-2 shadow-xl shadow-purple-950/50"
            >
              <Check size={18} />
              <span>সকল গেটওয়ে নম্বর রিয়েল-টাইমে আপডেট করুন</span>
            </button>
          </form>
        )}

        {/* TAB 4: PLAYER MANAGEMENT */}
        {activeTab === 'players' && (
          <div className="bg-[#0f121d] border border-purple-900/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">প্লেয়ার ম্যানেজমেন্ট তালিকা</h3>
                <p className="text-xs text-slate-400">ব্যালেন্স সমন্বয়, প্রোফাইল রিভিউ এবং ব্যান/আনব্যান কন্ট্রোল</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="ইউজারনেম, ফোন বা প্লেয়ার ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Players Table */}
            <div className="space-y-3">
              {filteredPlayers.map((player) => (
                <div
                  key={player._id || player.id}
                  className={`bg-[#07090e] border rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                    player.isBanned
                      ? 'border-red-900/60 bg-red-950/10'
                      : 'border-purple-900/20 hover:border-purple-700/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                        player.role === 'admin'
                          ? 'bg-purple-950 border border-purple-500/50 text-purple-300'
                          : player.vipTier === 'GOLD'
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}
                    >
                      {player.role === 'admin' ? <Shield size={20} /> : <Crown size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm sm:text-base">
                          {player.username}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                            player.role === 'admin'
                              ? 'bg-purple-950 text-purple-300 border border-purple-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {player.role}
                        </span>
                        {player.vipTier && (
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                            {player.vipTier} VIP
                          </span>
                        )}
                        {player.isBanned && (
                          <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full font-black animate-pulse">
                            BANNED
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                        <span className="font-mono text-slate-300">📱 {player.phone}</span>
                        <span>•</span>
                        <span>
                          ব্যালেন্স: <strong className="text-amber-400 font-bold">৳ {(player.balance || 0).toLocaleString()}</strong>
                        </span>
                        <span>•</span>
                        <span>পয়েন্ট: {player.points || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setProfileModal(player)}
                      className="flex-1 md:flex-initial bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1 border border-slate-700"
                    >
                      <Eye size={13} />
                      <span>প্রোফাইল</span>
                    </button>

                    <button
                      onClick={() =>
                        setBalanceModal({
                          isOpen: true,
                          player,
                          action: 'ADD',
                          amount: '',
                          reason: '',
                        })
                      }
                      className="flex-1 md:flex-initial bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-purple-200 font-black px-3.5 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-md"
                    >
                      <Edit3 size={13} />
                      <span>ব্যালেন্স এডিট (+/-)</span>
                    </button>

                    {player.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleBan(player)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 border ${
                          player.isBanned
                            ? 'bg-emerald-950 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
                            : 'bg-red-950 hover:bg-red-900 border-red-800 text-red-300'
                        }`}
                      >
                        {player.isBanned ? <UserCheck size={13} /> : <Ban size={13} />}
                        <span>{player.isBanned ? 'আনব্যান' : 'ব্যান'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: GAME RTP & ALGORITHM CONTROLLER */}
        {activeTab === 'rtp_controller' && (
          <div className="bg-[#0f121d] border border-purple-900/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={22} className="text-purple-400" />
                  <h3 className="text-lg font-black text-white">গেম RTP ও এলগোরিদম কন্ট্রোলার (House Advantage Engine)</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  এখানে সকল মিনি-গেম (Pharaoh 5x4 Grid, Lucky Mega Wheel, Aviator Crash) এর হাউজ মার্জিন ও উইন রেট নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <button
                onClick={handleResetRTPStats}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw size={13} />
                <span>RTP পরিসংখ্যান রিসেট</span>
              </button>
            </div>

            {/* Presets Mode Buttons */}
            <div>
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2.5">
                অ্যালগরিদম মোড প্রিসেট নির্বাচন করুন
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    mode: 'high_profit',
                    title: '🔥 High-Profit Mode',
                    desc: 'RTP 80% - 85% • হাউজ এডভান্টেজ ১৫%-২০%',
                    border: 'border-red-600/50',
                    bg: 'bg-red-950/20 hover:bg-red-950/40',
                    targetRtp: 84,
                  },
                  {
                    mode: 'standard',
                    title: '⚖️ Standard Mode',
                    desc: 'RTP 92% - 94% • টেকসই ৬%-৮% হাউজ লাভ',
                    border: 'border-purple-600/50',
                    bg: 'bg-purple-950/20 hover:bg-purple-950/40',
                    targetRtp: 93,
                  },
                  {
                    mode: 'loose',
                    title: '✨ Loose / Promotional',
                    desc: 'RTP 96% - 98% • আকর্ষণীয় প্লেয়ার রিটেনশন',
                    border: 'border-emerald-600/50',
                    bg: 'bg-emerald-950/20 hover:bg-emerald-950/40',
                    targetRtp: 97,
                  },
                ].map((p) => {
                  const isCurrent = rtpConfig.mode === p.mode;
                  return (
                    <button
                      key={p.mode}
                      onClick={() =>
                        handleUpdateRTP({
                          mode: p.mode as any,
                          targetRtp: p.targetRtp,
                        })
                      }
                      className={`p-4 rounded-2xl border text-left transition relative overflow-hidden ${
                        isCurrent
                          ? 'border-purple-500 bg-purple-950/60 shadow-lg shadow-purple-950/60 ring-2 ring-purple-500/30'
                          : `${p.border} ${p.bg}`
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute top-2.5 right-2.5 text-[9px] bg-purple-500 text-black font-black px-2 py-0.5 rounded-full">
                          সক্রিয়
                        </span>
                      )}
                      <h4 className="text-sm font-black text-white">{p.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Slider: Target RTP (80% to 98%) */}
            <div className="bg-[#07090e] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Percent size={16} className="text-purple-400" />
                    <span>টার্গেট RTP স্লাইডার (Win Rate: 80% to 98%)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    রিয়েল-টাইমে লাইভ স্লাইডার দিয়ে প্লেয়ারদের গড় রিটার্ন নিয়ন্ত্রণ করুন।
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-purple-400">
                    {rtpConfig.targetRtp}%
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">
                    হাউজ লাভ: {100 - rtpConfig.targetRtp}%
                  </p>
                </div>
              </div>

              <input
                type="range"
                min="80"
                max="98"
                step="1"
                value={rtpConfig.targetRtp}
                onChange={(e) =>
                  handleUpdateRTP({
                    targetRtp: Number(e.target.value),
                  })
                }
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />

              <div className="flex justify-between text-[11px] font-bold text-slate-500 font-mono">
                <span>৮০% (ম্যাক্সিমাম হাউজ প্রফিট)</span>
                <span className="text-purple-400">৯৩% (ব্যালেন্সড স্ট্যান্ডার্ড)</span>
                <span>৯৮% (প্লেয়ার প্রমোশন)</span>
              </div>
            </div>

            {/* Probability Breakdown Display */}
            <div className="bg-[#07090e] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                বর্তমান অ্যালগরিদম টায়ার প্রবাবিলিটি বিন্যাস
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#121624] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">নো উইন / লস (0x)</span>
                  <p className="text-base font-black text-red-400 mt-0.5">
                    {Math.round((rtpDisplayProbabilities.lose || 0.3) * 100)}%
                  </p>
                </div>

                <div className="bg-[#121624] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">ছোট জয় (1x - 2x)</span>
                  <p className="text-base font-black text-emerald-400 mt-0.5">
                    {Math.round((rtpDisplayProbabilities.low || 0.6) * 100)}%
                  </p>
                </div>

                <div className="bg-[#121624] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">মাঝারি জয় (3x - 5x)</span>
                  <p className="text-base font-black text-blue-400 mt-0.5">
                    {Math.round((rtpDisplayProbabilities.medium || 0.08) * 100)}%
                  </p>
                </div>

                <div className="bg-[#121624] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">মেগা / জ্যাকপট (10x+)</span>
                  <p className="text-base font-black text-amber-400 mt-0.5">
                    {Math.round((rtpDisplayProbabilities.high || 0.02) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Safeguards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Streak Protection */}
              <div className="bg-[#07090e] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-white">পরপর বড় জয় প্রতিরোধ (Streak Protection)</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">টানা একাধিক বড় জ্যাকপট প্রতিরোধ করে ফান্ড সুরক্ষিত রাখে</p>
                </div>
                <button
                  onClick={() =>
                    handleUpdateRTP({
                      streakProtection: !rtpConfig.streakProtection,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition relative p-0.5 ${
                    rtpConfig.streakProtection ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition transform ${
                      rtpConfig.streakProtection ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Force Drain Switch */}
              <div className="bg-[#07090e] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-amber-400">ইমার্জেন্সি ড্রেন মোড (Force Drain)</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">অতিরিক্ত পেআউট হলে সাময়িকভাবে উইন রেট কমিয়ে আনে</p>
                </div>
                <button
                  onClick={() =>
                    handleUpdateRTP({
                      isDrainActive: !rtpConfig.isDrainActive,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition relative p-0.5 ${
                    rtpConfig.isDrainActive ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition transform ${
                      rtpConfig.isDrainActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Live Telemetry Card */}
            <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Activity size={24} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-300">রিয়েল-টাইম লাইভ টেলিমেট্রি</span>
                  <p className="text-[11px] text-slate-400">
                    মোট স্পিন: {rtpDiagnostics.totalSpins} • মোট বেট: ৳{rtpDiagnostics.totalBets} • মোট পেআউট: ৳{rtpDiagnostics.totalPayouts}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">হিসাবকৃত লাইভ RTP:</span>
                <p className="text-lg font-black text-emerald-400 font-mono">
                  {liveRtpValue.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TRANSACTION LOGS */}
        {activeTab === 'transactions' && (
          <div className="bg-[#0f121d] border border-purple-900/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            {/* Header & Multi-level Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Type Filter */}
              <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'সকল ট্রানজেকশন' },
                  { id: 'DEPOSIT', label: 'ডিপোজিট' },
                  { id: 'WITHDRAW', label: 'উইথড্র' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => {
                      sounds.playClick();
                      setTxTypeFilter(tf.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      txTypeFilter === tf.id
                        ? 'bg-purple-600 text-white border-purple-500 font-black'
                        : 'bg-[#07090e] text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Status Filter & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={txFilter}
                  onChange={(e) => setTxFilter(e.target.value as any)}
                  className="bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">সব স্ট্যাটাস</option>
                  <option value="pending">অপেক্ষমান (Pending)</option>
                  <option value="approved">অনুমোদিত (Completed)</option>
                  <option value="rejected">বাতিলকৃত (Failed)</option>
                </select>

                <div className="relative w-full sm:w-60">
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="TrxID বা প্লেয়ার দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Table / List */}
            <div className="space-y-2.5">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-14 text-slate-500 text-xs">
                  কোনো ট্রানজেকশন রেকর্ড পাওয়া যায়নি
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-[#07090e] border border-purple-900/20 hover:border-purple-700/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          tx.type === 'DEPOSIT'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm ${
                              tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-blue-400'
                            }`}
                          >
                            {tx.type === 'DEPOSIT' ? '+' : '-'}৳ {tx.amount.toLocaleString()}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.2 rounded-full font-black uppercase ${
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : tx.status === 'FAILED'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                          <span className="text-[10px] text-slate-400">{tx.method}</span>
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>
                            ইউজার: <strong className="text-slate-200">{tx.userName || tx.userId}</strong>
                          </span>
                          {tx.accountNumber && (
                            <>
                              <span>•</span>
                              <span>নম্বর: {tx.accountNumber}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-slate-500">{tx.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* TrxID with 1-Click Copy */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {tx.trxId ? (
                        <button
                          onClick={() => handleCopy(tx.trxId!, tx.id)}
                          className="bg-[#121624] hover:bg-purple-950 border border-slate-700 hover:border-purple-500 text-purple-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm"
                          title="TrxID কপি করুন"
                        >
                          <Copy size={12} />
                          <span>{tx.trxId}</span>
                          {copiedId === tx.id && (
                            <span className="text-[10px] text-emerald-400 font-bold ml-1">✓ কপি</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">TrxID নেই</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* 6. MODALS */}

      {/* MODAL 1: REJECT CONFIRMATION MODAL */}
      {rejectModal && rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-red-900/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle size={20} />
                <h4 className="text-base font-black">
                  {rejectModal.type === 'deposit' ? 'ডিপোজিট বাতিলকরণ' : 'উইথড্র বাতিল ও রিফান্ড'}
                </h4>
              </div>
              <button
                onClick={() => setRejectModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              আপনি কি নিশ্চিত যে প্লেয়ার <strong className="text-white">{rejectModal.targetName}</strong> এর{' '}
              <strong className="text-amber-400">৳ {rejectModal.amount}</strong> টাকার অনুরোধটি বাতিল করতে চান?
            </p>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                বাতিলের কারণ (প্লেয়ারকে প্রদর্শিত হবে):
              </label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="যেমন: ভুল ট্রানজেকশন আইডি বা টাকা জমা পড়েনি..."
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                ফিরে যান
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl text-xs transition shadow-lg shadow-red-950"
              >
                নিশ্চিত বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PLAYER BALANCE ADJUSTMENT MODAL */}
      {balanceModal.isOpen && balanceModal.player && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-purple-900/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400">
                <Edit3 size={18} />
                <h4 className="text-base font-black">প্লেয়ার ওয়ালেট ব্যালেন্স পরিবর্তন</h4>
              </div>
              <button
                onClick={() =>
                  setBalanceModal({ isOpen: false, player: null, action: 'ADD', amount: '', reason: '' })
                }
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#07090e] p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                প্লেয়ার: <strong className="text-white">{balanceModal.player.username}</strong>
              </span>
              <span className="text-slate-400">
                বর্তমান ব্যালেন্স:{' '}
                <strong className="text-amber-400">৳ {(balanceModal.player.balance || 0).toLocaleString()}</strong>
              </span>
            </div>

            {/* Action Type Select */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">অ্যাকশন নির্বাচন করুন:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ADD', label: '+ টাকা যোগ' },
                  { id: 'SUBTRACT', label: '- টাকা কর্তন' },
                  { id: 'SET', label: '= ফিক্সড সেট' },
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setBalanceModal({ ...balanceModal, action: act.id as any })}
                    className={`py-2 rounded-xl text-xs font-black transition border ${
                      balanceModal.action === act.id
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-[#07090e] text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">টাকার পরিমাণ (BDT):</label>
              <input
                type="number"
                value={balanceModal.amount}
                onChange={(e) => setBalanceModal({ ...balanceModal, amount: e.target.value })}
                placeholder="যেমন: 500"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">কারণ / রেফারেন্স:</label>
              <input
                type="text"
                value={balanceModal.reason}
                onChange={(e) => setBalanceModal({ ...balanceModal, reason: e.target.value })}
                placeholder="ম্যানুয়াল রিচার্জ, বোনাস বা উইনিং এডজাস্টমেন্ট..."
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() =>
                  setBalanceModal({ isOpen: false, player: null, action: 'ADD', amount: '', reason: '' })
                }
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveBalanceAdjustment}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-2.5 rounded-xl text-xs transition shadow-lg shadow-purple-950"
              >
                ব্যালেন্স আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PLAYER PROFILE VIEW MODAL */}
      {profileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-purple-900/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400">
                <Crown size={20} />
                <h4 className="text-base font-black">প্লেয়ার প্রোফাইল বিবরণ</h4>
              </div>
              <button onClick={() => setProfileModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">ইউজারনেম:</span>
                <span className="font-bold text-white">{profileModal.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">ফোন নম্বর:</span>
                <span className="font-mono text-slate-200">{profileModal.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">ইউজার আইডি:</span>
                <span className="font-mono text-purple-300">{profileModal._id || profileModal.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">ভিআইপি স্ট্যাটাস:</span>
                <span className="font-bold text-amber-400">{profileModal.vipTier || 'BRONZE'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">বর্তমান ওয়ালেট ব্যালেন্স:</span>
                <span className="font-black text-amber-400">৳ {(profileModal.balance || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">মোট ডিপোজিট হিস্ট্রি:</span>
                <span className="font-bold text-emerald-400">৳ {(profileModal.totalDeposits || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">মোট উইথড্র হিস্ট্রি:</span>
                <span className="font-bold text-blue-400">৳ {(profileModal.totalWithdrawals || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">অ্যাকাউন্ট স্ট্যাটাস:</span>
                <span className={`font-black ${profileModal.isBanned ? 'text-red-400' : 'text-emerald-400'}`}>
                  {profileModal.isBanned ? 'সাময়িক ব্যানকৃত' : 'সক্রিয় (Active)'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setProfileModal(null)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
