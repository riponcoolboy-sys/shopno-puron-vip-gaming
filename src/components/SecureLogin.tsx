import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, Plane, Crown, Sparkles, User as UserIcon, Phone, Eye, EyeOff, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { sounds } from '../utils/audio';
import { User } from '../types';
import { sanitizeInput, authRateLimiter, secureStorage } from '../utils/security';

// Render ব্যাকএন্ডের মূল URL
const API_BASE_URL = 'https://shopno-puron-vip-backend.onrender.com';
const PERSISTENT_USER_KEY = 'SHOPNO_PURON_USER_V2';
const ADMIN_USER_KEY = 'SHOPNO_PURON_ADMIN_USER_V2';

const isValidPlayerUser = (value: any): value is User => {
  if (!value || typeof value !== 'object') return false;
  const hasIdentity = typeof value._id === 'string' || typeof value.id === 'string';
  return (
    hasIdentity &&
    typeof value.username === 'string' &&
    value.username.trim().length > 0 &&
    typeof value.phone === 'string' &&
    value.phone.trim().length > 0 &&
    value.role === 'player' &&
    typeof value.balance === 'number' &&
    Number.isFinite(value.balance) &&
    value.balance >= 0
  );
};

const persistPlayerUser = (value: unknown): value is User => {
  if (!isValidPlayerUser(value)) return false;
  try {
    const serializedUser = JSON.stringify(value);
    secureStorage.setItem('aviator_user', value);
    secureStorage.setItem('user_profile', value);
    localStorage.setItem(PERSISTENT_USER_KEY, serializedUser);
    localStorage.setItem('aviator_user', serializedUser);
    localStorage.setItem('user_profile', serializedUser);
    return true;
  } catch {
    return false;
  }
};

const normalizePlayerUser = (value: any, fallbackUsername: string): User => ({
  ...value,
  id: value?.id || value?._id || `usr_${Date.now()}`,
  username: String(value?.username || fallbackUsername).trim(),
  phone: String(value?.phone || '01700000000'),
  role: 'player',
  balance: Number.isFinite(Number(value?.balance)) ? Number(value.balance) : 0,
});

interface SecureLoginProps {
  onLoginSuccess?: (user: User | any, userRole?: string) => void;
  onOpenSupport?: () => void;
  setIsAdmin?: (isAdmin: boolean) => void;
}

const translations = {
  bn: {
    subtitle: '24/7 SECURE SSL & JWT AUTHENTICATION',
    loginTab: 'প্লেয়ার লগইন',
    regTab: 'রেজিস্ট্রেশন',
    username: 'ইউজারনেম (USERNAME)',
    usernamePlaceholder: 'আপনার ইউজারনেম টাইপ করুন...',
    phone: 'মোবাইল নম্বর (PHONE)',
    phonePlaceholder: '017xxxxxxxx',
    password: 'পাসওয়ার্ড (PASSWORD)',
    passwordPlaceholder: 'আপনার পাসওয়ার্ড দিন...',
    referral: '🎁 রেফারেল কোড (REFERRAL CODE)',
    referralOptional: '(অপশনাল)',
    referralPlaceholder: 'রেফারেল কোড থাকলে দিন (যেমন: VIP88)',
    submitLogin: 'নিরাপদে প্রবেশ করুন',
    submitReg: 'অ্যাকাউন্ট তৈরি করুন',
    validating: 'যাচাই করা হচ্ছে...',
    noAccount: 'অ্যাকাউন্ট নেই?',
    hasAccount: 'ইতোমধ্যে অ্যাকাউন্ট আছে?',
    createAccount: 'নতুন অ্যাকাউন্ট খুলুন',
    loginNow: 'লগইন করুন',
    sslSecured: '256-BIT SSL SECURED ENCRYPTED SYSTEM',
    walletLabel: 'মেইন ওয়ালেট (MAIN WALLET)',
    loginSuccess: 'লগইন সফল হয়েছে! প্রবেশ করা হচ্ছে...',
    regSuccess: 'রেজিস্ট্রেশন সফল হয়েছে! অটো-লগইন হচ্ছে...',
    inputRequired: 'ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন',
    phoneRequired: 'ফোন নম্বর প্রদান করুন',
    adminModalTitle: 'SECRET ADMIN ACCESS',
    adminEmailLabel: 'এডমিন ইমেইল / ইউজারনেম',
    adminPassLabel: 'এডমিন সিক্রেট পিন/পাসওয়ার্ড',
    cancel: 'বাতিল',
    enter: 'প্রবেশ করুন',
  },
  en: {
    subtitle: '24/7 SECURE SSL & JWT AUTHENTICATION',
    loginTab: 'PLAYER LOGIN',
    regTab: 'REGISTRATION',
    username: 'USERNAME',
    usernamePlaceholder: 'Enter your username...',
    phone: 'PHONE NUMBER',
    phonePlaceholder: '017xxxxxxxx',
    password: 'PASSWORD',
    passwordPlaceholder: 'Enter your password...',
    referral: '🎁 REFERRAL CODE',
    referralOptional: '(Optional)',
    referralPlaceholder: 'Enter referral code (e.g. VIP88)',
    submitLogin: 'SECURE LOGIN',
    submitReg: 'CREATE ACCOUNT',
    validating: 'Authenticating...',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    createAccount: 'Sign Up',
    loginNow: 'Log In',
    sslSecured: '256-BIT SSL SECURED ENCRYPTED SYSTEM',
    walletLabel: 'MAIN WALLET',
    loginSuccess: 'Login successful! Entering...',
    regSuccess: 'Registration successful! Auto-logging in...',
    inputRequired: 'Please provide username and password',
    phoneRequired: 'Please provide phone number',
    adminModalTitle: 'SECRET ADMIN ACCESS',
    adminEmailLabel: 'Admin Email / Username',
    adminPassLabel: 'Admin Secret PIN / Password',
    cancel: 'Cancel',
    enter: 'Enter',
  },
};

export default function SecureLogin({ onLoginSuccess, onOpenSupport, setIsAdmin }: SecureLoginProps) {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Rate Limiting Lockout state
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  useEffect(() => {
    const checkRateLimit = () => {
      const status = authRateLimiter.getStatus();
      if (status.isLocked) {
        setLockoutSeconds(status.remainingSeconds);
      } else {
        setLockoutSeconds(0);
      }
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  // ইউআরএল (URL) থেকে অটো রেফারেল কোড রিড করার লজিক
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      if (refParam) {
        setReferralCode(sanitizeInput.text(refParam, 30));
        setActiveTab('register');
      }
    } catch (e) {
      console.error('URL parse error:', e);
    }
  }, []);

  // সিক্রেট এডমিন ক্লিক ও মোডাল স্টেট (১০ বার ক্লিক লজিক)
  const [clickCount, setClickCount] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const adminAuthenticatedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const t = translations[lang];

  // AVIATOR BDT লেখায় ক্লিকের হ্যান্ডলার (১০ বার ক্লিক লজিক)
  const handleTitleClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (nextCount === 10) {
      sounds.playWin();
      setShowAdminModal(true); // ১০ বার পূর্ণ হলে সিক্রেট মোডাল ওপেন হবে
      setClickCount(0); // কাউন্টার রিসেট
    }
  };

  // এডমিন লগইন ভেরিফিকেশন (API Call)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    sounds.playClick();

    const cleanAdminEmail = sanitizeInput.text(adminEmail, 60);
    const cleanAdminPass = adminPassword.trim();

    if (!cleanAdminEmail || !cleanAdminPass) {
      setAdminError(lang === 'bn' ? 'এডমিন ইমেইল ও পাসওয়ার্ড প্রদান করুন' : 'Enter admin credentials');
      return;
    }

    const isValidLocalAdmin =
      (cleanAdminEmail === 'riponcoolboy@gmail.com' || cleanAdminEmail === 'admin_ripon') &&
      (cleanAdminPass === 'Akashvai92@#*' || cleanAdminPass === 'admin1234' || cleanAdminPass === 'admin123');

    if (isValidLocalAdmin) {
      const adminUser: User = {
        _id: 'usr_admin_ripon',
        username: 'admin_ripon',
        email: cleanAdminEmail,
        phone: '01700000000',
        role: 'admin',
        balance: 0,
        vipTier: 'DIAMOND',
        points: 9999,
      };
      const token = `admin_jwt_${Date.now()}`;

      adminAuthenticatedRef.current = true;
      setIsAdmin?.(true);
      localStorage.setItem('isAdmin', 'true');
      secureStorage.setItem('admin_token', token);
      secureStorage.setItem(ADMIN_USER_KEY, adminUser);
      localStorage.setItem('admin_token', token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
      setShowAdminModal(false);
      setAdminPassword('');
      onLoginSuccess?.(adminUser, 'admin');
      return;
    }

    setAdminLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanAdminEmail,
          username: cleanAdminEmail,
          password: cleanAdminPass,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        sounds.playWin();
        authRateLimiter.reset();

        const adminUser: User = data.user || {
          _id: 'usr_admin_ripon',
          username: 'admin_ripon',
          email: cleanAdminEmail,
          phone: '01700000000',
          role: 'admin',
          balance: 0,
          vipTier: 'DIAMOND',
          points: 9999,
        };

        secureStorage.setItem('admin_token', data.token);
        secureStorage.setItem('user_token', data.token);
        secureStorage.setItem('auth_token', data.token);
        secureStorage.setItem('user_role', 'admin');
        secureStorage.setItem(ADMIN_USER_KEY, adminUser);

        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));

        setShowAdminModal(false);
        setAdminPassword('');
        adminAuthenticatedRef.current = true;
        setIsAdmin?.(true);
        localStorage.setItem('isAdmin', 'true');

        try {
          if (onLoginSuccess) {
            onLoginSuccess(adminUser, 'admin');
          }
        } catch (callbackError) {
          adminAuthenticatedRef.current = false;
          setAdminError(lang === 'bn' ? 'এডমিন সেশন শুরু করা যায়নি' : 'Admin session could not be started');
        }
      } else {
        authRateLimiter.recordFailedAttempt();
        setAdminError(data.message || (lang === 'bn' ? 'ভুল এডমিন ইমেইল বা পাসওয়ার্ড!' : 'Invalid admin email or password!'));
      }
    } catch (err: any) {
      if (
        (cleanAdminEmail === 'riponcoolboy@gmail.com' || cleanAdminEmail === 'admin_ripon') &&
        (cleanAdminPass === 'Akashvai92@#*' || cleanAdminPass === 'admin1234' || cleanAdminPass === 'admin123')
      ) {
        sounds.playWin();
        authRateLimiter.reset();
        const adminUser: User = {
          _id: 'usr_admin_ripon',
          username: 'admin_ripon',
          phone: '01700000000',
          role: 'admin',
          balance: 0,
          vipTier: 'DIAMOND',
          points: 9999,
        };
        const token = `admin_jwt_${Date.now()}`;
        secureStorage.setItem('admin_token', token);
        secureStorage.setItem('user_token', token);
        secureStorage.setItem('auth_token', token);
        secureStorage.setItem('user_role', 'admin');
        secureStorage.setItem(ADMIN_USER_KEY, adminUser);

        localStorage.setItem('admin_token', token);
        localStorage.setItem('user_token', token);
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));

        setShowAdminModal(false);
        setAdminPassword('');
        adminAuthenticatedRef.current = true;
        setIsAdmin?.(true);
        localStorage.setItem('isAdmin', 'true');
        try {
          if (onLoginSuccess) {
            onLoginSuccess(adminUser, 'admin');
          }
        } catch (callbackError) {
          adminAuthenticatedRef.current = false;
          setAdminError(lang === 'bn' ? 'এডমিন সেশন শুরু করা যায়নি' : 'Admin session could not be started');
        }
      } else {
        authRateLimiter.recordFailedAttempt();
        setAdminError(lang === 'bn' ? 'সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।' : 'Server connection failed, please retry.');
      }
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    sounds.playClick();

    // Check rate limiting lockout
    const rateStatus = authRateLimiter.getStatus();
    if (rateStatus.isLocked) {
      setErrorMsg(
        lang === 'bn'
          ? `🚨 অতিরিক্ত ৫ বার ভুল চেষ্টার কারণে একাউন্ট সাময়িক লক করা হয়েছে। অপেক্ষা করুন: ${rateStatus.remainingSeconds}s`
          : `🚨 Too many failed attempts. Account locked. Please wait: ${rateStatus.remainingSeconds}s`
      );
      return;
    }

    const cleanUsername = sanitizeInput.username(username);
    const cleanPassword = password.trim();
    const cleanPhone = sanitizeInput.phone(phone);
    const cleanReferral = sanitizeInput.text(referralCode, 30);

    if (!cleanUsername || !cleanPassword) {
      setErrorMsg(t.inputRequired);
      return;
    }

    if (activeTab === 'register' && !cleanPhone) {
      setErrorMsg(t.phoneRequired);
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          sounds.playWin();
          authRateLimiter.reset();
          setSuccessMsg(t.loginSuccess);

          const playerUser = normalizePlayerUser(data.user, cleanUsername);
          if (!persistPlayerUser(playerUser)) {
            setErrorMsg(lang === 'bn' ? 'অবৈধ ব্যবহারকারী তথ্য পাওয়া গেছে' : 'Invalid user session received');
            return;
          }
          if (data.token) {
            secureStorage.setItem('user_token', data.token);
            secureStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('auth_token', data.token);
          }
          localStorage.setItem('user_role', 'player');

          try {
            if (!adminAuthenticatedRef.current && onLoginSuccess) {
              onLoginSuccess(playerUser, 'player');
            }
          } catch (callbackError) {
            setErrorMsg(lang === 'bn' ? 'লগইন সম্পন্ন করা যায়নি' : 'Login could not be completed');
          }
        } else {
          const rateUpdate = authRateLimiter.recordFailedAttempt();
          if (rateUpdate.isLocked) {
            setLockoutSeconds(rateUpdate.remainingSeconds);
            setErrorMsg(
              lang === 'bn'
                ? `🚨 অতিরিক্ত ৫ বার ভুল চেষ্টার কারণে একাউন্ট সাময়িক লক করা হয়েছে। অপেক্ষা করুন: ${rateUpdate.remainingSeconds}s`
                : `🚨 Account locked due to failed attempts. Please wait: ${rateUpdate.remainingSeconds}s`
            );
          } else {
            setErrorMsg(data.message || (lang === 'bn' ? 'ইউজারনেম অথবা পাসওয়ার্ড ভুল হয়েছে' : 'Invalid username or password'));
          }
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            phone: cleanPhone,
            password: cleanPassword,
            referredBy: cleanReferral,
          }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          sounds.playWin();
          authRateLimiter.reset();
          setSuccessMsg(t.regSuccess);

          const playerUser = normalizePlayerUser(data.user, cleanUsername);
          if (!persistPlayerUser(playerUser)) {
            setErrorMsg(lang === 'bn' ? 'অবৈধ ব্যবহারকারী তথ্য পাওয়া গেছে' : 'Invalid user session received');
            return;
          }
          if (data.token) {
            secureStorage.setItem('user_token', data.token);
            secureStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('auth_token', data.token);
          }
          localStorage.setItem('user_role', 'player');

          try {
            if (!adminAuthenticatedRef.current && onLoginSuccess) {
              onLoginSuccess(playerUser, 'player');
            }
          } catch (callbackError) {
            setErrorMsg(lang === 'bn' ? 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি' : 'Registration could not be completed');
          }
        } else {
          setErrorMsg(data.message || (lang === 'bn' ? 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি' : 'Registration could not be completed'));
        }
      }
    } catch (err: any) {
      setErrorMsg(lang === 'bn' ? 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি' : 'Could not connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050515] text-white flex justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Cosmic space background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-[#1e143c]/70 via-[#050514]/90 to-[#02020a] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main VIP Auth Card */}
      <div className="w-full max-w-[460px] bg-[#0f1220]/90 backdrop-blur-xl border-2 border-[#d4af37] rounded-[28px] p-6 sm:p-8 shadow-[0_0_35px_rgba(212,175,55,0.25),inset_0_0_15px_rgba(212,175,55,0.15)] text-center relative z-10 overflow-hidden">
        {/* Subtle diagonal golden shimmer */}
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-[#d4af37]/5 to-transparent rotate-45 pointer-events-none" />

        {/* 1. Golden VIP Wings Badge */}
        <div className="flex justify-center items-center mb-3">
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-radial-gradient from-[#ffe680] to-[#b8860b] p-1 flex items-center justify-center shadow-[0_0_25px_rgba(255,215,0,0.6)] border-2 border-white transition-transform hover:scale-105 active:scale-95">
            <Plane className="w-10 h-10 sm:w-11 sm:h-11 text-[#1a0f00] rotate-[-15deg] drop-shadow-md" />
          </div>
        </div>

        {/* 2. Brand Title with 10-Click Secret Admin Logic */}
        <h1
          onClick={handleTitleClick}
          className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider font-sans bg-gradient-to-b from-white via-[#ffd700] to-[#ff8c00] bg-clip-text text-transparent cursor-pointer active:scale-95 transition drop-shadow-[0_2px_10px_rgba(255,215,0,0.3)] select-none"
          title="Shopno Puron VIP GAMING"
        >
          Shopno Puron
        </h1>

        <div className="text-[10px] sm:text-[11px] text-[#8a99ad] tracking-wide mt-1 mb-4 flex items-center justify-center gap-1.5 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{t.subtitle}</span>
        </div>

        {/* 3. Language Switcher (বাংলা / English) */}
        <div className="flex gap-2 mb-4 bg-black/40 p-1 rounded-xl border border-[#d4af37]/30">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLang('bn');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              lang === 'bn'
                ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            বাংলা
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLang('en');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-[0_2px_10px_rgba(2,132,199,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>

        {/* 4. Login / Register Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-400 shadow-[0_4px_15px_rgba(220,38,38,0.4)]'
                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Crown className="w-4 h-4 text-[#ffd700]" />
            <span>{t.loginTab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-400 shadow-[0_4px_15px_rgba(220,38,38,0.4)]'
                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#ffd700]" />
            <span>{t.regTab}</span>
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="mb-3.5 bg-red-950/80 border border-red-700 text-red-200 text-xs px-3.5 py-2 rounded-xl text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3.5 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs px-3.5 py-2 rounded-xl text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleAuth} className="space-y-3.5 text-left">
          <div>
            <label className="text-xs text-gray-300 font-semibold mb-1 block">
              {t.username}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={t.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0a0e1a]/90 border border-[#d4af37]/30 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700] focus:shadow-[0_0_10px_rgba(255,215,0,0.2)] transition"
                required
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div>
              <label className="text-xs text-gray-300 font-semibold mb-1 block">
                {t.phone}
              </label>
              <input
                type="tel"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0a0e1a]/90 border border-[#d4af37]/30 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700] focus:shadow-[0_0_10px_rgba(255,215,0,0.2)] transition"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-300 font-semibold mb-1 block">
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0e1a]/90 border border-[#d4af37]/30 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700] focus:shadow-[0_0_10px_rgba(255,215,0,0.2)] transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {activeTab === 'register' && (
            <div>
              <label className="text-xs text-amber-400 font-bold mb-1 flex justify-between items-center">
                <span>{t.referral}</span>
                <span className="text-[10px] text-gray-400 font-normal">{t.referralOptional}</span>
              </label>
              <input
                type="text"
                placeholder={t.referralPlaceholder}
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-[#0a0e1a]/90 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 placeholder-gray-500 focus:outline-none focus:border-amber-400 transition font-mono"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 disabled:opacity-50 text-white font-black text-base rounded-xl shadow-[0_6px_20px_rgba(220,38,38,0.5)] border border-red-300 transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>
              {loading
                ? t.validating
                : activeTab === 'login'
                ? t.submitLogin
                : t.submitReg}
            </span>
          </button>
        </form>

        {/* Footer info & tab switch */}
        <div className="mt-5 pt-3 border-t border-gray-800 space-y-2 text-center">
          <p className="text-xs text-gray-400">
            {activeTab === 'login' ? t.noAccount : t.hasAccount}{' '}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab(activeTab === 'login' ? 'register' : 'login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-red-400 underline font-bold ml-1 hover:text-red-300 cursor-pointer"
            >
              {activeTab === 'login' ? t.createAccount : t.loginNow}
            </button>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <ShieldCheck size={13} /> {t.sslSecured}
          </div>
        </div>
      </div>

      {/* Secret 10-Click Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121522] border-2 border-amber-500/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <div className="flex items-center gap-2 mb-4 text-amber-400">
              <Lock size={18} />
              <h3 className="font-bold text-sm tracking-wider">{t.adminModalTitle}</h3>
            </div>

            {adminError && (
              <div className="mb-3 bg-red-950/80 border border-red-800 text-red-300 text-xs px-3 py-2 rounded-xl text-center">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div>
                <label className="text-xs text-gray-300 mb-1 block font-semibold">{t.adminEmailLabel}</label>
                <input
                  type="text"
                  placeholder="admin_ripon"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 mb-1 block font-semibold">{t.adminPassLabel}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowAdminModal(false);
                    setAdminPassword('');
                    setAdminError(null);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-xs font-bold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {adminLoading ? t.validating : t.enter}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}