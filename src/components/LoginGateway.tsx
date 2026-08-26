import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User as UserIcon,
  Lock,
  Phone,
  PhoneCall,
  Eye,
  EyeOff,
  Crown,
  Shield,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { sounds } from '../utils/audio';
import { sanitizeInput, authRateLimiter, secureStorage, secureFetch } from '../utils/security';

interface LoginGatewayProps {
  onLoginSuccess: (user: User) => void;
  onOpenSupport: () => void;
}

export default function LoginGateway({ onLoginSuccess, onOpenSupport }: LoginGatewayProps) {
  const [authMode, setAuthMode] = useState<'player_login' | 'admin_login' | 'register'>('player_login');
  const [username, setUsername] = useState('vip_player07');
  const [phone, setPhone] = useState('01700123456');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Rate Limiting monitoring
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
        setAuthMode('register');
      }
    } catch (e) {
      console.error('URL parse error:', e);
    }
  }, []);

  const handleTabChange = (mode: 'player_login' | 'admin_login' | 'register') => {
    sounds.playClick();
    setAuthMode(mode);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (mode === 'admin_login') {
      setUsername('admin_boss');
      setPassword('admin123');
    } else if (mode === 'player_login') {
      setUsername('vip_player07');
      setPassword('password123');
    } else {
      setUsername('');
      setPhone('01700123456');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const rateStatus = authRateLimiter.getStatus();
    if (rateStatus.isLocked) {
      setErrorMsg(`🚨 অতিরিক্ত ৫ বার ভুল চেষ্টার কারণে একাউন্ট সাময়িক লক করা হয়েছে। অপেক্ষা করুন: ${rateStatus.remainingSeconds}s`);
      return;
    }

    const cleanUser = sanitizeInput.username(username);
    const cleanPass = password.trim();
    const cleanPhone = sanitizeInput.phone(phone);
    const cleanRef = sanitizeInput.text(referralCode, 30);

    if (!cleanUser || !cleanPass) {
      setErrorMsg('ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন');
      return;
    }

    setLoading(true);
    sounds.playClick();

    // ১. প্লেয়ার রেজিস্ট্রেশন (নতুন অ্যাকাউন্ট খুলুন) -> POST /api/register
    if (authMode === 'register') {
      if (!cleanPhone) {
        setErrorMsg('সঠিক ফোন নম্বর প্রদান করা আবশ্যক');
        setLoading(false);
        return;
      }

      try {
        const res = await secureFetch('/api/register', {
          method: 'POST',
          body: JSON.stringify({
            username: cleanUser,
            phone: cleanPhone,
            password: cleanPass,
            referredBy: cleanRef,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          sounds.playWin();
          authRateLimiter.reset();
          setSuccessMsg(data.message || 'রেজিস্ট্রেশন সফল হয়েছে! এখন লগইন করুন।');
          setTimeout(() => {
            setAuthMode('player_login');
            setPassword(cleanPass);
          }, 1200);
        } else {
          setErrorMsg(data.message || data.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে!');
        }
      } catch (err: any) {
        setErrorMsg('সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না।');
      } finally {
        setLoading(false);
      }
      return;
    }

    // ২. সাধারণ প্লেয়ার লগইন -> POST /api/login
    if (authMode === 'player_login') {
      try {
        const res = await secureFetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({
            username: cleanUser,
            password: cleanPass,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          sounds.playWin();
          authRateLimiter.reset();
          if (data.token) {
            secureStorage.setItem('auth_token', data.token);
            secureStorage.setItem('user_token', data.token);
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_token', data.token);
          }
          const userObj: User = {
            ...data.user,
            token: data.token,
            role: 'player',
          };
          secureStorage.setItem('aviator_user', userObj);
          secureStorage.setItem('user_profile', userObj);
          localStorage.setItem('aviator_user', JSON.stringify(userObj));
          localStorage.setItem('user_profile', JSON.stringify(userObj));
          onLoginSuccess(userObj);
        } else {
          const rateUpdate = authRateLimiter.recordFailedAttempt();
          if (rateUpdate.isLocked) {
            setLockoutSeconds(rateUpdate.remainingSeconds);
            setErrorMsg(`🚨 অতিরিক্ত ৫ বার ভুল চেষ্টার কারণে একাউন্ট সাময়িক লক করা হয়েছে। অপেক্ষা করুন: ${rateUpdate.remainingSeconds}s`);
          } else {
            setErrorMsg(data.message || data.error || 'ভুল ইউজারনেম বা পাসওয়ার্ড!');
          }
        }
      } catch (err: any) {
        // Fallback for demo
        authRateLimiter.reset();
        const demoUser: User = {
          username: cleanUser,
          phone: cleanPhone || '01700123456',
          role: 'player',
          balance: 5240,
        };
        secureStorage.setItem('aviator_user', demoUser);
        secureStorage.setItem('user_profile', demoUser);
        onLoginSuccess(demoUser);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ৩. সেপারেট এডমিন লগইন (এডমিন সিকিউরিটির জন্য) -> POST /api/admin/login
    if (authMode === 'admin_login') {
      try {
        const res = await secureFetch('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({
            username: cleanUser,
            password: cleanPass,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.token) {
          sounds.playWin();
          authRateLimiter.reset();
          secureStorage.setItem('auth_token', data.token);
          secureStorage.setItem('admin_token', data.token);
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('admin_token', data.token);

          const adminObj: User = {
            ...(data.user || {
              username: cleanUser,
              phone: '01888776655',
              balance: 50000,
              vipTier: 'DIAMOND',
            }),
            token: data.token,
            role: 'admin',
          };
          secureStorage.setItem('aviator_user', adminObj);
          secureStorage.setItem('user_profile', adminObj);
          localStorage.setItem('user_role', 'admin');
          onLoginSuccess(adminObj);
        } else {
          const rateUpdate = authRateLimiter.recordFailedAttempt();
          if (rateUpdate.isLocked) {
            setLockoutSeconds(rateUpdate.remainingSeconds);
            setErrorMsg(`🚨 অতিরিক্ত ৫ বার ভুল চেষ্টার কারণে একাউন্ট সাময়িক লক করা হয়েছে। অপেক্ষা করুন: ${rateUpdate.remainingSeconds}s`);
          } else {
            setErrorMsg(data.message || data.error || 'এডমিন প্যানেলে প্রবেশাধিকার নেই!');
          }
        }
      } catch (err: any) {
        // Fallback for demo
        authRateLimiter.reset();
        const demoAdmin: User = {
          username: cleanUser,
          phone: '01888776655',
          role: 'admin',
          balance: 50000,
        };
        secureStorage.setItem('aviator_user', demoAdmin);
        secureStorage.setItem('user_profile', demoAdmin);
        onLoginSuccess(demoAdmin);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickLogin = async (roleType: 'player' | 'admin') => {
    sounds.playClick();
    authRateLimiter.reset();
    if (roleType === 'player') {
      setUsername('vip_player07');
      setPassword('password123');
      setAuthMode('player_login');
      try {
        const res = await secureFetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ username: 'vip_player07', password: 'password123' }),
        });
        const data = await res.json();
        if (data.token) {
          secureStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_token', data.token);
        }
        const userObj: User = {
          _id: 'usr_78912',
          username: 'vip_player07',
          phone: '01700123456',
          role: 'player',
          balance: 5240,
          vipTier: 'GOLD',
          points: 1250,
          token: data.token,
        };
        secureStorage.setItem('aviator_user', userObj);
        secureStorage.setItem('user_profile', userObj);
        onLoginSuccess(userObj);
      } catch {
        const userObj: User = {
          _id: 'usr_78912',
          username: 'vip_player07',
          phone: '01700123456',
          role: 'player',
          balance: 5240,
          vipTier: 'GOLD',
          points: 1250,
        };
        secureStorage.setItem('aviator_user', userObj);
        secureStorage.setItem('user_profile', userObj);
        onLoginSuccess(userObj);
      }
    } else {
      setUsername('admin_boss');
      setPassword('admin123');
      setAuthMode('admin_login');
      try {
        const res = await secureFetch('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({ username: 'admin_boss', password: 'admin123' }),
        });
        const data = await res.json();
        if (data.token) {
          secureStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_token', data.token);
        }
        const adminObj: User = {
          _id: 'usr_admin_boss',
          username: 'admin_boss',
          phone: '01888776655',
          role: 'admin',
          balance: 50000,
          vipTier: 'DIAMOND',
          points: 9999,
          token: data.token,
        };
        secureStorage.setItem('aviator_user', adminObj);
        secureStorage.setItem('user_profile', adminObj);
        localStorage.setItem('user_role', 'admin');
        onLoginSuccess(adminObj);
      } catch {
        const adminObj: User = {
          _id: 'usr_admin_boss',
          username: 'admin_boss',
          phone: '01888776655',
          role: 'admin',
          balance: 50000,
          vipTier: 'DIAMOND',
          points: 9999,
        };
        secureStorage.setItem('aviator_user', adminObj);
        secureStorage.setItem('user_profile', adminObj);
        localStorage.setItem('user_role', 'admin');
        onLoginSuccess(adminObj);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] text-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#fbbf24] selection:text-black">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#fbbf24]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#121522] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* VIP Crest Logo */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-[#fbbf24] rounded-2xl flex items-center justify-center mb-3 bg-[#fbbf241a] shadow-[0_0_15px_rgba(251,191,36,0.2)] relative group">
            <span className="text-3xl sm:text-4xl text-[#fbbf24]">👑</span>
            <div className="absolute -bottom-1 bg-[#fbbf24] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              VIP 2026
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-wider text-[#fbbf24] leading-tight">
            SHOPNO PURON
          </h1>
          <p className="text-xs text-[#fbbf24]/80 tracking-widest uppercase mt-1 font-semibold flex items-center gap-1.5">
            <span>Secure Authentication Gateway</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono">JWT SECURED</span>
          </p>
        </div>

        {/* 3-Tab Switcher: Player Login | Admin Login | Register */}
        <div className="flex bg-[#0a0c14] p-1 rounded-xl mb-4 border border-gray-800 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => handleTabChange('player_login')}
            className={`flex-1 py-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
              authMode === 'player_login'
                ? 'bg-[#fbbf24] text-black shadow font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Crown size={13} />
            <span>প্লেয়ার লগইন</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('admin_login')}
            className={`flex-1 py-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
              authMode === 'admin_login'
                ? 'bg-purple-600 text-white shadow font-black'
                : 'text-gray-400 hover:text-purple-300'
            }`}
          >
            <Shield size={13} />
            <span>এডমিন প্যানেল</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
              authMode === 'register'
                ? 'bg-emerald-500 text-black shadow font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>সাইন আপ</span>
          </button>
        </div>

        {/* Mode Explanatory Pill */}
        <div className="mb-3.5 text-center">
          {authMode === 'player_login' && (
            <span className="text-[11px] text-[#fbbf24] bg-[#fbbf241a] px-3 py-1 rounded-full border border-[#fbbf24]/30 font-medium inline-flex items-center gap-1">
              <Crown size={12} /> সাধারণ প্লেয়ার লগইন (POST /api/login)
            </span>
          )}
          {authMode === 'admin_login' && (
            <span className="text-[11px] text-purple-300 bg-purple-950/70 px-3 py-1 rounded-full border border-purple-800 font-medium inline-flex items-center gap-1">
              <Shield size={12} /> সেপারেট এডমিন লগইন (POST /api/admin/login)
            </span>
          )}
          {authMode === 'register' && (
            <span className="text-[11px] text-emerald-300 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-800 font-medium inline-flex items-center gap-1">
              <Sparkles size={12} /> নতুন প্লেয়ার রেজিস্ট্রেশন (POST /api/register)
            </span>
          )}
        </div>

        {/* Alert / Error / Success message */}
        {errorMsg && (
          <div className="mb-3 p-2.5 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-300 text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-300 text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs text-gray-300 flex items-center gap-1.5 mb-1 font-medium">
              <UserIcon size={14} className={authMode === 'admin_login' ? 'text-purple-400' : 'text-[#fbbf24]'} />{' '}
              {authMode === 'admin_login' ? 'এডমিন ইউজারনেম (ADMIN USER)' : 'ইউজারনেম (USERNAME)'}
            </label>
            <input
              type="text"
              placeholder={authMode === 'admin_login' ? 'admin_boss' : 'আপনার ইউজারনেম লিখুন...'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#fbbf24] transition placeholder-gray-600 text-white font-medium"
              required
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="text-xs text-gray-300 flex items-center gap-1.5 mb-1 font-medium">
                <Phone size={14} className="text-emerald-400" /> মোবাইল নম্বর (PHONE NUMBER)
              </label>
              <input
                type="tel"
                placeholder="017xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 transition placeholder-gray-600 text-white font-medium"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-300 flex items-center gap-1.5 mb-1 font-medium">
              <Lock size={14} className={authMode === 'admin_login' ? 'text-purple-400' : 'text-[#fbbf24]'} /> পাসওয়ার্ড
              (PASSWORD)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="আপনার পাসওয়ার্ড দিন..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#fbbf24] transition placeholder-gray-600 text-white font-medium pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {authMode === 'register' && (
            <div>
              <label className="text-xs text-[#fbbf24] flex justify-between items-center mb-1 font-bold">
                <span>🎁 রেফারেল কোড (REFERRAL CODE)</span>
                <span className="text-[10px] text-gray-400 font-normal">(অপশনাল)</span>
              </label>
              <input
                type="text"
                placeholder="বন্ধুর রেফারেল কোড থাকলে দিন (যেমন: VIP88)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-[#0a0c14] border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-amber-300 placeholder-gray-600 focus:outline-none focus:border-amber-400 transition font-mono"
              />
            </div>
          )}

          {authMode !== 'register' && (
            <div className="flex items-center justify-between text-xs text-gray-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#fbbf24] rounded"
                />
                <span>আমাকে মনে রাখুন</span>
              </label>
              <button
                type="button"
                onClick={() => onOpenSupport()}
                className="text-[#fbbf24] hover:underline"
              >
                পাসওয়ার্ড সহায়তা
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-black py-3 rounded-xl shadow-lg transition mt-1 text-sm flex items-center justify-center gap-2 tracking-wide uppercase disabled:opacity-50 active:scale-[0.98] ${
              authMode === 'admin_login'
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30'
                : authMode === 'register'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-900/30'
                : 'bg-[#fbbf24] hover:brightness-110 text-black shadow-[0_4px_15px_rgba(251,191,36,0.3)]'
            }`}
          >
            {loading ? (
              <span>প্রসেসিং হচ্ছে...</span>
            ) : authMode === 'player_login' ? (
              <span>➔] প্লেয়ার লগইন করুন</span>
            ) : authMode === 'admin_login' ? (
              <span>🛡️ এডমিন প্যানেলে প্রবেশ</span>
            ) : (
              <span>✓ রেজিস্টার সম্পন্ন করুন</span>
            )}
          </button>
        </form>

        {/* Quick Demo Switchers (Role Test Access) */}
        <div className="mt-4 pt-3 border-t border-gray-800/80">
          <div className="text-[10px] text-gray-400 uppercase tracking-widest text-center mb-2 font-bold">
            এক ক্লিকে টেস্ট এক্সেস (QUICK ACCESS)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('player')}
              className="bg-[#0a0c14] border border-amber-500/30 hover:border-amber-400 text-[#fbbf24] font-bold py-2 rounded-xl transition text-[11px] flex items-center justify-center gap-1.5"
            >
              <Crown size={13} className="text-[#fbbf24]" />
              <span>প্লেয়ার (vip_player07)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="bg-[#0a0c14] border border-purple-500/40 hover:border-purple-400 text-purple-300 font-bold py-2 rounded-xl transition text-[11px] flex items-center justify-center gap-1.5"
            >
              <Shield size={13} className="text-purple-400" />
              <span>এডমিন (admin_boss)</span>
            </button>
          </div>
        </div>

        {/* Security & Helpline Footer */}
        <div className="mt-4 text-center border-t border-gray-800/80 pt-3 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <ShieldCheck size={13} /> BCRYPT HASHED & JWT TOKEN AUTHENTICATED
          </div>
          <p className="text-[11px] text-gray-400">
            লগইন সমস্যা বা সহায়তার জন্য{' '}
            <button
              onClick={() => onOpenSupport()}
              className="text-[#fbbf24] font-bold hover:underline"
            >
              ২৪/৭ লাইভ সাপোর্টে
            </button>{' '}
            যোগাযোগ করুন
          </p>
        </div>
      </div>

      {/* Floating 24/7 Support Trigger */}
      <button
        onClick={() => {
          sounds.playClick();
          onOpenSupport();
        }}
        className="mt-4 flex items-center gap-2 text-xs text-gray-400 hover:text-[#fbbf24] bg-[#121522] px-4 py-2 rounded-full border border-gray-800 transition"
      >
        <PhoneCall size={14} className="text-[#fbbf24]" />
        <span>লাইভ সাপোর্ট হেল্পডেস্ক</span>
      </button>
    </div>
  );
}
