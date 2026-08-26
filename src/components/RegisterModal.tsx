import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import { sanitizeInput, secureStorage, secureFetch } from '../utils/security';

interface RegisterModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onRegisterSuccess?: (user: any) => void;
}

export default function RegisterModal({
  isOpen = true,
  onClose,
  onRegisterSuccess,
}: RegisterModalProps) {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  // ইউআরএল (URL) থেকে অটো রেফারেল কোড রিড করার লজিক
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      if (refParam) {
        setReferralCode(sanitizeInput.text(refParam, 30));
      }
    } catch (e) {
      console.error('URL parse error:', e);
    }
  }, []);

  if (isOpen === false) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    sounds.playClick();

    const cleanUser = sanitizeInput.username(username);
    const cleanPhone = sanitizeInput.phone(phone);
    const cleanPass = password.trim();
    const cleanRef = sanitizeInput.text(referralCode, 30);

    if (!cleanUser || !cleanPhone || !cleanPass) {
      alert('সঠিক ইউজারনেম, ফোন নম্বর এবং পাসওয়ার্ড প্রদান করুন');
      setLoading(false);
      return;
    }

    try {
      const res = await secureFetch('/api/auth/register', {
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
        alert('🎉 রেজিস্ট্রেশন সফল হয়েছে!');
        if (data.token) {
          secureStorage.setItem('user_token', data.token);
          secureStorage.setItem('auth_token', data.token);
          localStorage.setItem('user_token', data.token);
          localStorage.setItem('auth_token', data.token);
        }
        if (data.user) {
          secureStorage.setItem('aviator_user', data.user);
          secureStorage.setItem('user_profile', data.user);
          localStorage.setItem('aviator_user', JSON.stringify(data.user));
          localStorage.setItem('user_profile', JSON.stringify(data.user));
        }
        if (onRegisterSuccess) onRegisterSuccess(data.user);
        if (onClose) onClose();
      } else {
        sounds.playCrash();
        alert(data.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে!');
      }
    } catch (err) {
      console.error(err);
      sounds.playCrash();
      alert('সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <form onSubmit={handleRegister} className="space-y-4">
        {/* ইউজারনেম */}
        <div>
          <label className="text-xs text-slate-300 font-bold block mb-1">ইউজারনেম (USERNAME)</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="আপনার ইউজারনেম টাইপ করুন..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 placeholder-slate-500"
          />
        </div>

        {/* ফোন নম্বর */}
        <div>
          <label className="text-xs text-slate-300 font-bold block mb-1">ফোন নম্বর (PHONE)</label>
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="017XXXXXXXX"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 placeholder-slate-500"
          />
        </div>

        {/* পাসওয়ার্ড */}
        <div>
          <label className="text-xs text-slate-300 font-bold block mb-1">পাসওয়ার্ড (PASSWORD)</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="আপনার পাসওয়ার্ড দিন..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 placeholder-slate-500"
          />
        </div>

        {/* রেফারেল কোড (নতুন যুক্ত করা হলো) */}
        <div>
          <label className="text-xs text-amber-400 font-bold flex justify-between items-center mb-1">
            <span>🎁 রেফারেল কোড (REFERRAL CODE)</span>
            <span className="text-[10px] text-slate-400 font-normal">(অপশনাল)</span>
          </label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="বন্ধুর রেফারেল কোড থাকলে দিন (যেমন: VIP88)"
            className="w-full bg-slate-900/90 border border-amber-500/40 rounded-xl px-4 py-3 text-sm text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {/* সাবমিট বাটন */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-sm transition shadow-lg tracking-wider uppercase mt-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
        >
          {loading ? 'প্রসেসিং হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
        </button>
      </form>
    </div>
  );
}
