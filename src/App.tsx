import { WalletProvider } from './WalletContext';
import React, { useState, useEffect, useCallback } from 'react';
import { GameCategory, GameItem, Transaction, UserWallet, PaymentSettings, DepositRequest, User, PaymentGateway } from './types';
import SecureLogin from './components/SecureLogin';
import AdminDashboard from './components/AdminDashboard';
import UserLobby from './components/UserLobby';
import SupportModal from './components/SupportModal';
import { sounds } from './utils/audio';
import { realtimeSync } from './utils/realtimeSync';
import { sendDirectTelegramWithdrawAlert } from './utils/telegram';
import { secureStorage, secureFetch, sanitizeInput, apiUrl } from './utils/security';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

// গেমের বর্তমান ভার্সন (প্রতিবার আপডেট দিলে এটি পরিবর্তন করবেন, যেমন: 1.0.1 -> 1.0.2)
const CURRENT_VERSION = "1.0.2";
const PERSISTENT_USER_KEY = 'SHOPNO_PURON_USER_V2';
const PERSISTENT_BALANCE_KEY = 'SHOPNO_PURON_BALANCE_V2';

const parseJsonValue = (raw: string | null) => {
  if (!raw || raw === 'null' || raw === 'undefined') return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? null;
  } catch {
    return null;
  }
};

const isValidStoredUser = (value: any): value is User => {
  if (!value || typeof value !== 'object') return false;
  const hasIdentity = typeof value._id === 'string' || typeof value.id === 'string';
  return (
    hasIdentity &&
    typeof value.username === 'string' &&
    value.username.trim().length > 0 &&
    typeof value.phone === 'string' &&
    value.phone.trim().length > 0 &&
    (value.role === 'player' || value.role === 'admin') &&
    typeof value.balance === 'number' &&
    Number.isFinite(value.balance) &&
    value.balance >= 0
  );
};

const clearBrokenAuthState = () => {
  const keysToClear = [
    'user_token',
    'auth_token',
    'token',
    'user_role',
    'user_profile',
    'aviator_user',
    'user',
    'shopno_puron_user_data',
    'shopno_puron_balance',
    'SHOPNO_PURON_USER_V2',
    'SHOPNO_PURON_BALANCE_V2',
    'user_balance',
    'shopno_puron_wallet',
  ];
  keysToClear.forEach((key) => localStorage.removeItem(key));
};

const readPersistentUser = () => {
  const direct = parseJsonValue(localStorage.getItem(PERSISTENT_USER_KEY));
  if (isValidStoredUser(direct)) return direct;

  const legacy = parseJsonValue(localStorage.getItem('aviator_user'))
    || parseJsonValue(localStorage.getItem('user_profile'))
    || parseJsonValue(localStorage.getItem('user'));
  if (isValidStoredUser(legacy)) return legacy;

  return null;
};

const writePersistentUser = (user: Partial<User> | null) => {
  if (!user) return;
  try {
    const value = JSON.stringify(user);
    localStorage.setItem(PERSISTENT_USER_KEY, value);
    localStorage.setItem('SHOPNO_PURON_USER_V2', value);
    localStorage.setItem('aviator_user', value);
    localStorage.setItem('user_profile', value);
    localStorage.setItem('user', value);
  } catch (err) {
    console.warn('User persistence failed:', err);
  }
};

const writePersistentBalance = (balance: number) => {
  try {
    localStorage.setItem(PERSISTENT_BALANCE_KEY, String(Math.max(0, Number(balance) || 0)));
    localStorage.setItem('SHOPNO_PURON_BALANCE_V2', String(Math.max(0, Number(balance) || 0)));
    localStorage.setItem('user_balance', String(Math.max(0, Number(balance) || 0)));
    localStorage.setItem('shopno_puron_balance', String(Math.max(0, Number(balance) || 0)));
  } catch (err) {
    console.warn('Balance persistence failed:', err);
  }
};

export default function App() {
  // ভার্সন কন্ট্রোল এবং স্বয়ংক্রিয় ক্যাশ ক্লিয়ারিং লজিক
  useEffect(() => {
    const savedVersion = localStorage.getItem('app_version');

    // যদি ব্রাউজারের ভার্সনের সাথে সার্ভারের ভার্সন না মিলে
    if (savedVersion !== CURRENT_VERSION) {
      localStorage.setItem('app_version', CURRENT_VERSION);
      
      // ব্রাউজারের ক্যাশ ক্লিয়ার করে নতুন করে পেজ লোড করানো
      if (window.caches) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      (window.location as any).reload(true); // হার্ড রিফ্রেশ
    }
  }, []);

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'player' | 'admin' | null>(null);
  const [tamperWarning, setTamperWarning] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // PaymentSettings Schema State
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => {
    const saved = secureStorage.getItem<PaymentSettings>('shopno_payment_settings', null);
    if (saved) return saved;
    try {
      const fallback = localStorage.getItem('shopno_payment_settings');
      if (fallback) return JSON.parse(fallback);
    } catch {}
    return {
      bkashNumber: '01888-776655',
      nagadNumber: '01777-665544',
      bankAccountNumber: '102.110.45892',
      bankNameDetails: 'Islami Bank Bangladesh Ltd (IBBL), Motijheel Branch, Dhaka',
      updatedAt: 'আজ',
    };
  });

  // Deposit Requests Schema State
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => {
    const saved = secureStorage.getItem<DepositRequest[]>('shopno_deposit_requests', null);
    if (saved && Array.isArray(saved)) return saved;
    try {
      const fallback = localStorage.getItem('shopno_deposit_requests');
      if (fallback) return JSON.parse(fallback);
    } catch {}
    return [
      {
        id: 'dep-101',
        userId: 'usr_78912',
        userName: 'vip_player07',
        paymentMethod: 'bkash',
        amount: 1000,
        transactionId: 'BK902X88',
        senderNumber: '01700123456',
        status: 'approved',
        bonusApplied: true,
        bonusAmount: 500,
        createdAt: 'আজ ১২:১০ PM',
      },
      {
        id: 'dep-102',
        userId: 'usr_44521',
        userName: 'arif_khan99',
        paymentMethod: 'nagad',
        amount: 2000,
        transactionId: 'NG88A312',
        senderNumber: '01811223344',
        status: 'pending',
        bonusApplied: true,
        bonusAmount: 1000,
        createdAt: 'আজ ০১:০৫ PM',
      },
    ];
  });

  // User Wallet & Persistence with SHA-256 Anti-Tamper
  const [wallet, setWallet] = useState<UserWallet>(() => {
    const saved = secureStorage.getItem<UserWallet>('shopno_puron_wallet', null, () => {
      console.warn('[Security] Wallet tampering detected! Re-syncing with server.');
    });
    if (saved && typeof saved.balance === 'number') return saved;
    try {
      const fallback = localStorage.getItem('shopno_puron_wallet');
      if (fallback) return JSON.parse(fallback);
    } catch {}
    return {
      balance: 5240,
      totalBets: 48,
      totalWon: 14850,
      vipTier: 'GOLD',
      points: 1250,
    };
  });

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-101',
      type: 'DEPOSIT',
      method: 'bKash',
      amount: 1000,
      status: 'COMPLETED',
      timestamp: 'আজ ১২:১০ PM',
      trxId: 'BK902X88',
    },
    {
      id: 'tx-102',
      type: 'WIN',
      amount: 3200,
      status: 'COMPLETED',
      timestamp: 'আজ ১২:২৫ PM',
      gameTitle: 'Aviator Pro 2026',
    },
  ]);

  // ১. মোবাইল বা ব্রাউজার লোড হওয়ার সাথে সাথে সেভড টোকেন চেক করবে
  useEffect(() => {
    try {
      const savedToken =
        secureStorage.getItem<string>('auth_token', null) ||
        secureStorage.getItem<string>('user_token', null) ||
        localStorage.getItem('token') ||
        localStorage.getItem('user_token') ||
        localStorage.getItem('auth_token');
      const savedRole =
        (localStorage.getItem('user_role') as 'player' | 'admin') || null;
      const rawStoredUser = localStorage.getItem(PERSISTENT_USER_KEY);
      let savedUser: User | null = null;

      if (rawStoredUser) {
        const parsed = JSON.parse(rawStoredUser);
        if (isValidStoredUser(parsed)) savedUser = parsed;
      }

      if (!savedUser) {
        const secureUser = secureStorage.getItem<User>('aviator_user', null);
        const profileUser = secureStorage.getItem<User>('user_profile', null);
        const legacyUser = readPersistentUser();
        savedUser = [secureUser, profileUser, legacyUser].find(isValidStoredUser) || null;
      }

      if (savedToken && savedUser && isValidStoredUser(savedUser)) {
        setToken(savedToken);
        setRole(savedRole || savedUser.role);
        setCurrentUser(savedUser);
        setWallet((prev) => ({ ...prev, balance: savedUser.balance }));
        writePersistentBalance(savedUser.balance);
        return;
      }

      clearBrokenAuthState();
      setToken(null);
      setRole(null);
      setCurrentUser(null);
    } catch (err) {
      console.error('Storage error:', err);
      clearBrokenAuthState();
      setToken(null);
      setRole(null);
      setCurrentUser(null);
    }
  }, []);

  // ডাটাবেজ থেকে আসল প্রোফাইল ও লাইভ ব্যালেন্স ফেচ করার ফাংশন
  const loadUserProfile = useCallback(async () => {
    const activeToken =
      secureStorage.getItem<string>('auth_token', null) ||
      secureStorage.getItem<string>('user_token', null) ||
      token;
    if (!activeToken) return;

    try {
      const res = await secureFetch('/api/auth/profile');
      const data = await res.json();
      if (data.success && data.user) {
        const profileUser = data.user as Partial<User>;
        // ডাটাবেজের আসল ব্যালেন্স ফ্রন্টএন্ডে সেটিং
        if (typeof profileUser.balance === 'number') {
          setWallet((prev) => ({ ...prev, balance: profileUser.balance as number }));
        }
        setCurrentUser((prev) => {
          if (!prev) return null;
          const updatedUser: User = {
            ...prev,
            ...profileUser,
            username: profileUser.username ?? prev.username,
            phone: profileUser.phone ?? prev.phone,
            role: profileUser.role ?? prev.role,
            balance: profileUser.balance ?? prev.balance,
          };
          return updatedUser;
        });
      }
    } catch (err) {
      console.error('Profile Fetch Error:', err);
    }
  }, [token]);

  // Anti-tamper verification loop / window focus verification
  useEffect(() => {
    const verifyIntegrity = () => {
      const verifiedWallet = secureStorage.getItem<UserWallet>(
        'shopno_puron_wallet',
        null,
        () => {
          setTamperWarning('🚨 মেমরি টেম্পারিং প্রতিরোধ করা হয়েছে! সার্ভার ব্যালেন্স রিস্টোর করা হলো।');
          loadUserProfile();
          setTimeout(() => setTamperWarning(null), 5000);
        }
      );
      if (verifiedWallet && typeof verifiedWallet.balance === 'number') {
        setWallet(verifiedWallet);
      }
    };

    window.addEventListener('focus', verifyIntegrity);
    window.addEventListener('storage', verifyIntegrity);
    return () => {
      window.removeEventListener('focus', verifyIntegrity);
      window.removeEventListener('storage', verifyIntegrity);
    };
  }, [loadUserProfile]);

  // ডাটাবেজ থেকে আসল প্রোফাইল ও লাইভ ব্যালেন্স ফেচ করার লজিক এবং রিয়েল-টাইম WebSocket/Polling কানেকশন
  useEffect(() => {
    const activeUserId = currentUser?._id || currentUser?.id || 'usr_78912';

    // WebSocket auto-reconnect এবং HTTP polling fallback ইনিশিয়ালাইজেশন
    realtimeSync.connect(activeUserId);

    const unsubscribe = realtimeSync.on('balance_update', (data: any) => {
      if (typeof data.balance === 'number') {
        const validatedBal = Math.max(0, Number(data.balance));
        setWallet((prev) => ({ ...prev, balance: validatedBal }));
        setCurrentUser((prev) => {
          if (!prev) return null;
          const upd: User = { ...prev, balance: validatedBal };
          secureStorage.setItem('aviator_user', upd);
          return upd;
        });
      }
    });

    const unsubscribeDeposits = realtimeSync.on('deposit_update', (data: any) => {
      const incomingDeposit = data.deposit;
      const activeUserId = currentUser?._id || currentUser?.id;
      const depositBelongsToUser = incomingDeposit && (!activeUserId || String(incomingDeposit.userId) === String(activeUserId));

      if (data.actionType === 'DEPOSIT_APPROVED' && depositBelongsToUser) {
        loadUserProfile();
      }

      if (currentUser?.role !== 'admin') return;

      if (Array.isArray(data.deposits)) {
        setDepositRequests(data.deposits.map((deposit: any) => ({
          id: deposit._id || deposit.id,
          userId: deposit.userId,
          userName: deposit.userName,
          paymentMethod: deposit.paymentMethod,
          amount: deposit.amount,
          transactionId: deposit.transactionId,
          senderNumber: deposit.senderNumber,
          status: deposit.status,
          rejectionReason: deposit.rejectionReason,
          createdAt: deposit.createdAt,
          updatedAt: deposit.updatedAt,
        })));
      } else if (data.deposit) {
        setDepositRequests((previous) => {
          const incoming = data.deposit;
          const mapped = {
            id: incoming._id || incoming.id,
            userId: incoming.userId,
            userName: incoming.userName,
            paymentMethod: incoming.paymentMethod,
            amount: incoming.amount,
            transactionId: incoming.transactionId,
            senderNumber: incoming.senderNumber,
            status: incoming.status,
            rejectionReason: incoming.rejectionReason,
            createdAt: incoming.createdAt,
            updatedAt: incoming.updatedAt,
          };
          return [mapped, ...previous.filter((deposit) => deposit.id !== mapped.id)];
        });
      }
    });

    loadUserProfile();

    return () => {
      unsubscribe();
      unsubscribeDeposits();
    };
  }, [token, currentUser?._id, currentUser?.id, loadUserProfile]);

  // Fetch active payment settings and deposit requests from API
  useEffect(() => {
    secureFetch('/api/payment-methods')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setPaymentSettings(data.settings);
        }
      })
      .catch(() => {});

    secureFetch('/api/deposits')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.deposits)) {
          const mapped = data.deposits.map((d: any) => ({
            id: d._id || d.id,
            userId: d.userId,
            userName: d.userName,
            paymentMethod: d.paymentMethod,
            amount: d.amount,
            transactionId: d.transactionId,
            senderNumber: d.senderNumber,
            status: d.status,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          }));
          setDepositRequests(mapped);
        }
      })
      .catch(() => {});
  }, [token]);

  // Persist Local States with secureStorage (Envelope SHA-256)
  useEffect(() => {
    secureStorage.setItem('shopno_puron_wallet', wallet);
    localStorage.setItem('shopno_puron_wallet', JSON.stringify(wallet));
    writePersistentBalance(wallet.balance);
  }, [wallet]);

  useEffect(() => {
    if (currentUser && currentUser.username) {
      writePersistentUser(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    secureStorage.setItem('shopno_payment_settings', paymentSettings);
    localStorage.setItem('shopno_payment_settings', JSON.stringify(paymentSettings));
  }, [paymentSettings]);

  useEffect(() => {
    secureStorage.setItem('shopno_deposit_requests', depositRequests);
    localStorage.setItem('shopno_deposit_requests', JSON.stringify(depositRequests));
  }, [depositRequests]);

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sounds.setMuted(nextMute);
  };

  const handleLoginSuccess = (user: User | string, userRoleParam?: string) => {
    let tok = '';
    let resolvedRole: 'player' | 'admin' = 'player';
    let nextUser: User | null = null;

    if (typeof user === 'string') {
      resolvedRole = (userRoleParam as any) || (user.toLowerCase().includes('admin') ? 'admin' : 'player');
      tok =
        secureStorage.getItem<string>('auth_token', null) ||
        secureStorage.getItem<string>('user_token', null) ||
        localStorage.getItem('user_token') ||
        localStorage.getItem('auth_token') ||
        `tok_${Date.now()}`;
      nextUser = {
        _id: `usr_${Date.now()}`,
        username: sanitizeInput.username(user),
        phone: '01700123456',
        role: resolvedRole,
        balance: resolvedRole === 'admin' ? 50000 : 5240,
        vipTier: resolvedRole === 'admin' ? 'DIAMOND' : 'GOLD',
      };
    } else {
      if (!isValidStoredUser(user)) {
        clearBrokenAuthState();
        setToken(null);
        setRole(null);
        setCurrentUser(null);
        return;
      }
      resolvedRole = user.role || 'player';
      tok =
        user.token ||
        secureStorage.getItem<string>('auth_token', null) ||
        localStorage.getItem('user_token') ||
        localStorage.getItem('auth_token') ||
        `tok_${Date.now()}`;
      nextUser = { ...user, role: resolvedRole, balance: user.balance ?? wallet.balance ?? 5240 };
    }

    if (nextUser && isValidStoredUser(nextUser)) {
      setCurrentUser(nextUser);
      if (typeof nextUser.balance === 'number') {
        setWallet((prev) => ({ ...prev, balance: nextUser.balance }));
      }
      secureStorage.setItem('aviator_user', nextUser);
      secureStorage.setItem('user_profile', nextUser);
      writePersistentUser(nextUser);
      writePersistentBalance(nextUser.balance ?? wallet.balance ?? 5240);
      localStorage.setItem('user_profile', JSON.stringify(nextUser));
    } else {
      clearBrokenAuthState();
      setToken(null);
      setRole(null);
      setCurrentUser(null);
      return;
    }

    secureStorage.setItem('user_token', tok);
    secureStorage.setItem('auth_token', tok);
    localStorage.setItem('user_token', tok);
    localStorage.setItem('auth_token', tok);
    localStorage.setItem('user_role', resolvedRole);

    setToken(tok);
    setRole(resolvedRole);
  };

  const handleLogout = () => {
    sounds.playClick();
    secureStorage.removeItem('user_token');
    secureStorage.removeItem('auth_token');
    secureStorage.removeItem('aviator_user');
    secureStorage.removeItem('user_profile');
    localStorage.removeItem('user_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_profile');
    localStorage.removeItem(PERSISTENT_USER_KEY);
    localStorage.removeItem(PERSISTENT_BALANCE_KEY);
    localStorage.removeItem('shopno_puron_balance');
    localStorage.removeItem('user_balance');
    localStorage.removeItem('user');
    clearBrokenAuthState();
    setToken(null);
    setRole(null);
  };

  const handleUpdateBalance = (
    newBalance: number,
    amountWonOrLost: number,
    type: 'BET' | 'WIN',
    description: string
  ) => {
    // সঠিক নিয়ম (Strict Number Addition & Math.max ensure non-negative numeric balance):
    const validatedNewBalance = Math.max(0, Number(newBalance) || 0);
    const validAmount = Number(amountWonOrLost) || 0;

    setWallet((prev) => {
      const currentBal = Number(prev.balance) || 0;
      const updatedBalance = type === 'WIN' 
        ? Math.max(0, currentBal + validAmount) 
        : validatedNewBalance;

      return {
        ...prev,
        balance: validatedNewBalance,
        totalWon: type === 'WIN' ? (Number(prev.totalWon) || 0) + validAmount : (Number(prev.totalWon) || 0),
        totalBets: type === 'BET' ? (Number(prev.totalBets) || 0) + 1 : (Number(prev.totalBets) || 0),
        points: (Number(prev.points) || 0) + Math.floor(validAmount / 10),
      };
    });

    // Update current user state with strict numeric balance
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, balance: validatedNewBalance };
      secureStorage.setItem('aviator_user', updated);
      localStorage.setItem('user', JSON.stringify(updated));
      writePersistentUser(updated);
      writePersistentBalance(validatedNewBalance);
      return updated;
    });

    if (!description.startsWith('SERVER_SETTLED ')) {
      realtimeSync.syncBalanceUpdate(validatedNewBalance, validAmount, type, description);
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type,
      amount: validAmount,
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gameTitle: description,
    };
    setTransactions((prev) => [newTx, ...prev.slice(0, 19)]);
  };

  const handleRequestDeposit = async (depositData: {
    paymentMethod: PaymentGateway;
    amount: number;
    transactionId: string;
    senderNumber: string;
    bonusApplied?: boolean;
  }) => {
    const activeUser = currentUser;
    if (!activeUser) return;
    const bonusAmount = depositData.bonusApplied ? Math.floor(depositData.amount * 0.5) : 0;
    const newRequest: DepositRequest = {
      id: `dep-${Date.now()}`,
      userId: activeUser._id || 'usr_78912',
      userName: activeUser.username,
      paymentMethod: depositData.paymentMethod,
      amount: depositData.amount,
      transactionId: depositData.transactionId,
      senderNumber: depositData.senderNumber,
      status: 'pending',
      bonusApplied: depositData.bonusApplied,
      bonusAmount,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDepositRequests((prev) => [newRequest, ...prev]);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'DEPOSIT',
      method: depositData.paymentMethod,
      amount: depositData.amount + bonusAmount,
      status: 'PENDING',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      trxId: depositData.transactionId,
    };
    setTransactions((prev) => [newTx, ...prev]);

    try {
      const response = await fetch(apiUrl('/api/deposit/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser._id || 'usr_78912',
          userName: activeUser.username,
          paymentMethod: depositData.paymentMethod,
          amount: depositData.amount,
          transactionId: depositData.transactionId,
          senderNumber: depositData.senderNumber,
        }),
      });
      if (!response.ok) throw new Error('Deposit request failed');
    } catch {}
  };

  const handleApproveDeposit = async (depositId: string) => {
    const target = depositRequests.find((r) => r.id === depositId);
    if (!target) return;

    const totalCredited = target.amount + (target.bonusAmount || 0);

    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + totalCredited,
      points: prev.points + Math.floor(totalCredited / 5),
    }));

    setDepositRequests((prev) =>
      prev.map((r) => (r.id === depositId ? { ...r, status: 'approved' } : r))
    );

    setTransactions((prev) =>
      prev.map((tx) =>
        tx.trxId === target.transactionId ? { ...tx, status: 'COMPLETED' } : tx
      )
    );

    try {
      const activeToken = token || localStorage.getItem('user_token') || localStorage.getItem('auth_token');
      await fetch(apiUrl('/api/admin/deposit/approve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ depositId }),
      });
    } catch {}
  };

  const handleRejectDeposit = async (depositId: string, reason?: string) => {
    setDepositRequests((prev) =>
      prev.map((r) => (r.id === depositId ? { ...r, status: 'rejected', rejectionReason: reason } : r))
    );

    const target = depositRequests.find((r) => r.id === depositId);
    if (target) {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.trxId === target.transactionId ? { ...tx, status: 'FAILED' } : tx
        )
      );
    }

    try {
      const activeToken = token || localStorage.getItem('user_token') || localStorage.getItem('auth_token');
      await fetch(apiUrl('/api/admin/deposit/reject'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ depositId, reason }),
      });
    } catch {}
  };

  const handleUpdatePaymentSettings = async (settings: PaymentSettings) => {
    setPaymentSettings(settings);

    try {
      const activeToken = token || localStorage.getItem('user_token') || localStorage.getItem('auth_token');
      await fetch(apiUrl('/api/admin/payment-settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          bkashNumber: settings.bkashNumber,
          nagadNumber: settings.nagadNumber,
          bankAccountNumber: settings.bankAccountNumber,
          bankNameDetails: settings.bankNameDetails,
        }),
      });
    } catch {}
  };

  const handleWithdraw = (
    amount: number,
    method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay',
    phone: string
  ): boolean => {
    const activeUser = currentUser;
    if (!activeUser || amount > wallet.balance) return false;

    const newBal = Math.max(0, wallet.balance - amount);
    setWallet((prev) => ({
      ...prev,
      balance: newBal,
    }));

    setCurrentUser((prev) => {
      if (!prev) return null;
      const upd: User = { ...prev, balance: newBal };
      localStorage.setItem('user', JSON.stringify(upd));
      return upd;
    });

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'WITHDRAW',
      method,
      amount,
      status: 'PENDING',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      trxId: `WTH-${phone.slice(-4)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 💸 Direct Telegram Bot API Call (Frontend-to-Telegram)
    sendDirectTelegramWithdrawAlert({
      username: activeUser.username || 'Player',
      amount,
      accountNumber: phone,
      method,
    });

    const cleanPhone = sanitizeInput.phone(phone);
    // Send withdraw request to backend to trigger Telegram Bot alert
    secureFetch('/api/withdraw/request', {
      method: 'POST',
      body: JSON.stringify({
        userId: activeUser._id || activeUser.id || 'usr_78912',
        userName: activeUser.username || 'Player',
        amount,
        paymentMethod: method,
        accountNumber: cleanPhone || phone,
        phone: cleanPhone || phone,
      }),
    }).catch((err) => {
      console.error('Withdraw API call error:', err);
    });

    return true;
  };

  const handleClaimVipReward = (amount: number, description: string) => {
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'VIP_BONUS',
      amount,
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gameTitle: description,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // ২. যদি টোকেন না থাকে, তবে অন্য মোবাইলে লিংক খুললেই আগে লগইন পেজ দেখাবে
  if (!token || !currentUser) {
    return (
      <>
        {tamperWarning && (
          <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-500/50 text-rose-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md animate-bounce">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{tamperWarning}</span>
          </div>
        )}
        <SecureLogin
          onLoginSuccess={(userObj: any, userRole?: string) => {
            if (typeof userObj === 'string') {
              const tok = userObj;
              const r = (userRole as 'player' | 'admin') || 'player';
              secureStorage.setItem('user_token', tok);
              localStorage.setItem('user_token', tok);
              localStorage.setItem('user_role', r);
              setToken(tok);
              setRole(r);
            } else {
              handleLoginSuccess(userObj, userRole);
            }
          }}
          onOpenSupport={() => setShowSupportModal(true)}
        />
        {showSupportModal && (
          <SupportModal onClose={() => setShowSupportModal(false)} />
        )}
      </>
    );
  }

  // ৩. রোল অনুযায়ী আলাদা ড্যাশবোর্ড দেখাবে
  return (
    <div className="relative min-h-screen">
      {tamperWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-500/50 text-rose-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{tamperWarning}</span>
        </div>
      )}
      {role === 'admin' ? (
        <AdminDashboard
          currentUser={currentUser}
          paymentSettings={paymentSettings}
          depositRequests={depositRequests}
          onUpdatePaymentSettings={handleUpdatePaymentSettings}
          onApproveDeposit={handleApproveDeposit}
          onRejectDeposit={handleRejectDeposit}
          onLogout={handleLogout}
          onSwitchToLobby={() => setRole('player')}
        />
      ) : (
        <UserLobby
          username={currentUser?.username || 'Player'}
          currentUser={currentUser}
          wallet={wallet}
          transactions={transactions}
          paymentSettings={paymentSettings}
          depositRequests={depositRequests}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onLogout={handleLogout}
          onUpdateBalance={handleUpdateBalance}
          onRequestDeposit={handleRequestDeposit}
          onWithdraw={handleWithdraw}
          onClaimVipReward={handleClaimVipReward}
          onOpenAdmin={
            currentUser.role === 'admin'
              ? () => setRole('admin')
              : undefined
          }
        />
      )}

      {showSupportModal && (
        <SupportModal onClose={() => setShowSupportModal(false)} />
      )}
    </div>
  );
}
