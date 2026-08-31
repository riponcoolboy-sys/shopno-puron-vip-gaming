// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Menu,
  PlusCircle,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  Shield,
  Crown,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react';
import { UserWallet, User } from '../types';
import { sounds } from '../utils/audio';
import { isAdminSession } from '../utils/security';

interface HeaderProps {
  username: string;
  currentUser?: User | null;
  wallet: UserWallet;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenDeposit: () => void;
  onOpenVipRewards: () => void;
  onOpenSidebar: () => void;
  onOpenMessages?: () => void;
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

export default function Header({
  username,
  currentUser,
  wallet,
  isMuted,
  onToggleMute,
  onOpenDeposit,
  onOpenVipRewards,
  onOpenSidebar,
  onOpenMessages,
  onOpenProfile,
  onOpenAdmin,
  onLogout,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isAdmin = currentUser?.role === 'admin';
  const canReturnToAdmin = Boolean(
    onOpenAdmin &&
      (isAdmin || isAdminSession() || localStorage.getItem('user_role') === 'admin' || !!localStorage.getItem('admin_token'))
  );
  const displayBalance = (() => {
    try {
      const walletObjStr = localStorage.getItem('shopno_puron_wallet');
      if (walletObjStr) {
        const parsed = JSON.parse(walletObjStr);
        if (typeof parsed.balance === 'number') return parsed.balance;
      }
      const rawBal = localStorage.getItem('user_balance');
      if (rawBal) return parseFloat(rawBal);
    } catch (e) {}
    return wallet?.balance ?? 1500;
  })();

  return (
    <header className="bg-[#0B0E14] border-b border-[#FFC700]/20 px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Left: Hamburger Menu Trigger + Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Slide-out Sidebar Trigger Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenSidebar();
          }}
          className="p-2 rounded-xl bg-[#141A29] hover:bg-[#1C253B] border border-gray-800 text-[#FFC700] hover:text-white transition flex items-center justify-center shadow-sm"
          title="মেনু খুলুন"
          aria-label="Open Sidebar Menu"
        >
          <Menu size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenSidebar}>
          <div className="w-8 h-8 rounded-xl border border-[#FFC700] flex items-center justify-center bg-gradient-to-tr from-[#FFC700]/20 to-amber-400/10 shadow-[0_0_12px_rgba(255,199,0,0.35)]">
            <Crown size={18} className="text-[#FFC700]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black italic text-[#FFC700] leading-none tracking-wider flex items-center gap-1">
              SHOPNO PURON
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide uppercase ${
                  isAdmin
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'bg-[#FFC700]/15 text-[#FFC700]'
                }`}
              >
                {isAdmin ? '🛡️ ADMIN' : '👑 ROYAL VIP'}
              </span>
              <span className="text-[8px] text-emerald-400 font-mono flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Dynamic Balance Badge + Audio + User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Dynamic Balance Badge */}
        <div
          onClick={() => {
            sounds.playClick();
            onOpenDeposit();
          }}
          className="cursor-pointer bg-[#121724] hover:bg-[#182032] border border-[#FFC700]/40 rounded-full pl-2.5 sm:pl-3 pr-1 py-1 flex items-center gap-1.5 sm:gap-2 transition shadow-[0_0_10px_rgba(255,199,0,0.15)] group"
        >
          <div className="flex flex-col text-right">
            <span className="text-[8px] sm:text-[9px] text-gray-400 uppercase font-semibold leading-none">
              ব্যালেন্স
            </span>
            <span className="text-xs sm:text-sm font-black text-[#FFC700] font-mono leading-tight group-hover:text-amber-200">
              ৳{displayBalance.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            className="w-6 h-6 rounded-full bg-gradient-to-r from-[#FFC700] to-yellow-400 text-black flex items-center justify-center shadow-md hover:scale-105 transition"
            title="ডিপোজিট করুন"
          >
            <PlusCircle size={14} className="stroke-[3]" />
          </button>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleMute();
          }}
          className={`p-2 rounded-xl border transition ${
            isMuted
              ? 'bg-[#121724] text-gray-500 border-gray-800'
              : 'bg-[#FFC700]/10 text-[#FFC700] border-[#FFC700]/30'
          }`}
          title={isMuted ? 'সাউন্ড চালু করুন' : 'সাউন্ড বন্ধ করুন'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {canReturnToAdmin && (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenAdmin?.();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-purple-500/60 bg-gradient-to-r from-purple-950/80 to-violet-900/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-purple-200 shadow-[0_8px_24px_rgba(147,51,234,0.25)]"
          >
            <Shield size={12} />
            <span>এডমিন</span>
          </button>
        )}

        {/* User Avatar with Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              sounds.playClick();
              setShowProfileMenu(!showProfileMenu);
            }}
            className={`bg-[#121724] hover:bg-[#182032] border ${
              isAdmin ? 'border-purple-500/50 text-purple-200' : 'border-[#FFC700]/30 text-gray-200'
            } p-1 sm:px-2 sm:py-1 rounded-xl flex items-center gap-1.5 transition text-xs font-bold`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                isAdmin
                  ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                  : 'bg-[#FFC700]/20 text-[#FFC700] border border-[#FFC700]/40'
              }`}
            >
              {isAdmin ? <Shield size={13} /> : <Crown size={13} />}
            </div>
            <span className="max-w-[65px] truncate hidden md:inline">{username}</span>
            <ChevronDown size={13} className="text-gray-400 hidden sm:inline" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0B0E14] border border-[#FFC700]/40 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="border-b border-gray-800 pb-2 mb-2">
                <p className="text-[10px] text-gray-400">লগইন ইউজার:</p>
                <p className="text-sm font-black text-[#FFC700] truncate">{username}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      isAdmin
                        ? 'bg-purple-950 text-purple-300 border-purple-700'
                        : 'bg-[#FFC700]/20 text-[#FFC700] border-[#FFC700]/30'
                    }`}
                  >
                    {isAdmin ? '🛡️ ROLE: ADMIN' : `👑 VIP ${wallet.vipTier}`}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                {isAdmin && onOpenAdmin && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenAdmin();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#FFC700] hover:bg-[#FFC700]/10 flex items-center justify-between font-bold"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings size={13} /> এডমিন কন্ট্রোল সেন্টার
                    </span>
                  </button>
                )}

                {onOpenProfile && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-gray-800 flex items-center justify-between"
                  >
                    <span>আমার প্রোফাইল</span>
                    <span className="text-gray-400 text-[10px]">ভিউ ➔</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenDeposit();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-gray-800 flex items-center justify-between"
                >
                  <span>ডিপোজিট / উইথড্র</span>
                  <span className="text-[#FFC700] font-mono">৳{wallet.balance.toLocaleString()}</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenVipRewards();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-gray-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#FFC700]" /> দৈনিক ভিআইপি বোনাস
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-1.5 border-t border-gray-800 mt-1"
                >
                  <LogOut size={13} />
                  <span>লগআউট করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
