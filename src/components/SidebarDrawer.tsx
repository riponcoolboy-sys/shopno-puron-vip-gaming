import React from 'react';
import {
  X,
  Home,
  UserPlus,
  Bell,
  Smartphone,
  Crown,
  Sparkles,
  Headphones,
  Globe,
  LogOut,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
  Volume2,
  VolumeX,
  ShieldAlert,
} from 'lucide-react';
import { User, UserWallet } from '../types';
import { sounds } from '../utils/audio';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  username: string;
  wallet: UserWallet;
  isMuted: boolean;
  onToggleMute: () => void;
  onNavigateHome: () => void;
  onOpenInvite: () => void;
  onOpenMessages: () => void;
  onOpenDownloadApp: () => void;
  onOpenVip: () => void;
  onOpenRewards: () => void;
  onOpenSupport: () => void;
  onOpenLanguage: () => void;
  onOpenDeposit: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
  currentLanguage?: 'bn' | 'en';
}

export default function SidebarDrawer({
  isOpen,
  onClose,
  currentUser,
  username,
  wallet,
  isMuted,
  onToggleMute,
  onNavigateHome,
  onOpenInvite,
  onOpenMessages,
  onOpenDownloadApp,
  onOpenVip,
  onOpenRewards,
  onOpenSupport,
  onOpenLanguage,
  onOpenDeposit,
  onOpenAdmin,
  onLogout,
  currentLanguage = 'bn',
}: SidebarDrawerProps) {
  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    {
      id: 'home',
      label: currentLanguage === 'bn' ? 'হোম পেইজ' : 'Home',
      icon: Home,
      action: () => {
        sounds.playClick();
        onClose();
        onNavigateHome();
      },
      badge: null,
      color: 'text-[#FFC700]',
    },
    {
      id: 'invite',
      label: currentLanguage === 'bn' ? 'বন্ধুদের ইনভাইট করুন' : 'Invite Friends',
      icon: UserPlus,
      action: () => {
        sounds.playClick();
        onClose();
        onOpenInvite();
      },
      badge: currentLanguage === 'bn' ? '৳১০০ ফ্রি' : '৳100 Free',
      color: 'text-amber-400',
    },
    {
      id: 'messages',
      label: currentLanguage === 'bn' ? 'মেসেজ ও নোটিফিকেশন' : 'Messages',
      icon: Bell,
      action: () => {
        sounds.playClick();
        onClose();
        onOpenMessages();
      },
      badge: '2',
      color: 'text-sky-400',
    },
    {
      id: 'download',
      label: currentLanguage === 'bn' ? 'ডাউনলোড অ্যাপ' : 'Download App',
      icon: Smartphone,
      action: () => {
        sounds.playClick();
        onClose();
        onOpenDownloadApp();
      },
      badge: 'APK',
      color: 'text-emerald-400',
    },
    {
      id: 'vip',
      label: currentLanguage === 'bn' ? 'ভিআইপি ক্লাব' : 'VIP Club',
      icon: Crown,
      action: () => {
        sounds.playClick();
        onClose();
        onOpenVip();
      },
      badge: wallet.vipTier,
      color: 'text-[#FFC700]',
    },
    {
      id: 'rewards',
      label: currentLanguage === 'bn' ? 'ডেইলি রিওয়ার্ডস' : 'Rewards',
      icon: Sparkles,
      action: () => {
        sounds.playClick();
        onClose();
        onOpenRewards();
      },
      badge: currentLanguage === 'bn' ? 'বোনাস' : 'Bonus',
      color: 'text-pink-400',
    },
    {
      id: 'support',
      label: currentLanguage === 'bn' ? '২৪/৭ লাইভ সাপোর্ট' : 'Support 24/7',
      icon: Headphones,
      action: () => {
        sounds.playClick();
        onClose();
        onOpenSupport();
      },
      badge: 'Online',
      color: 'text-emerald-400',
    },
    {
      id: 'language',
      label: currentLanguage === 'bn' ? 'ভাষা (Language)' : 'Language',
      icon: Globe,
      action: () => {
        sounds.playClick();
        onClose();
        onOpenLanguage();
      },
      badge: currentLanguage === 'bn' ? 'বাংলা' : 'EN',
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => {
          sounds.playClick();
          onClose();
        }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-[#0B0E14] border-r border-[#FFC700]/20 shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar z-10 transition-transform duration-300 animate-in slide-in-from-left">
        {/* Top Section */}
        <div>
          {/* Header Bar */}
          <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-[#101522]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFC700] to-amber-300 text-[#0B0E14] flex items-center justify-center font-black shadow-[0_0_15px_rgba(255,199,0,0.4)]">
                <Crown size={20} className="fill-[#0B0E14]" />
              </div>
              <div>
                <h2 className="text-base font-black italic text-[#FFC700] tracking-wider leading-none">
                  SHOPNO PURON
                </h2>
                <p className="text-[10px] text-gray-400 tracking-widest uppercase font-semibold mt-1">
                  ROYAL VIP CASINO
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-gray-800/70 hover:bg-gray-700 text-gray-400 hover:text-white transition"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-4 bg-gradient-to-br from-[#121826] to-[#0D121D] border-b border-gray-800">
            <div className="flex items-center gap-3">
              {/* Avatar with gold border */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFC700]/30 to-amber-500/20 border-2 border-[#FFC700] flex items-center justify-center text-xl shadow-[0_0_12px_rgba(255,199,0,0.3)]">
                  {isAdmin ? '🛡️' : '👑'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0B0E14] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white truncate">{username}</h3>
                  <span className="text-[9px] font-black bg-[#FFC700] text-black px-1.5 py-0.5 rounded-md uppercase">
                    {isAdmin ? 'ADMIN' : wallet.vipTier}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  ID: {currentUser?._id ? currentUser._id.slice(-6) : '889214'}
                </p>
              </div>
            </div>

            {/* Dynamic Balance Badge Pill */}
            <div className="mt-3.5 bg-[#0B0E14] border border-[#FFC700]/30 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">মেইন ওয়ালেট ব্যালেন্স</span>
                <span className="text-base font-black text-[#FFC700] font-mono leading-tight">
                  ৳{wallet.balance.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onOpenDeposit();
                }}
                className="bg-gradient-to-r from-[#FFC700] to-yellow-400 hover:brightness-110 text-black font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-[0_2px_10px_rgba(255,199,0,0.3)] transition"
              >
                <PlusCircle size={14} className="stroke-[2.5]" />
                <span>ডিপোজিট</span>
              </button>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-[#151C2C] border border-transparent hover:border-[#FFC700]/20 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-gray-800/60 group-hover:bg-black/40 ${item.color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="group-hover:text-white">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFC700]/10 border border-[#FFC700]/30 text-[#FFC700]">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-[#FFC700] transition" />
                  </div>
                </button>
              );
            })}

            {/* Admin Control Center Link if role === admin */}
            {isAdmin && onOpenAdmin && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-950/60 border border-purple-800/80 text-purple-300 hover:bg-purple-900 transition"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="text-purple-400" />
                    <span>এডমিন কন্ট্রোল সেন্টার</span>
                  </div>
                  <ChevronRight size={14} className="text-purple-400" />
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-800/80 bg-[#101522] space-y-2">
          {/* Quick Sound Toggle & License Badge */}
          <div className="flex items-center justify-between px-2 text-[11px] text-gray-400">
            <button
              onClick={() => {
                sounds.playClick();
                onToggleMute();
              }}
              className="flex items-center gap-1.5 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-[#FFC700]" />}
              <span>সাউন্ড {isMuted ? 'বন্ধ' : 'চালু'}</span>
            </button>
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck size={14} />
              <span>SSL Secured 256-Bit</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 hover:text-red-300 text-xs font-black transition"
          >
            <LogOut size={15} />
            <span>লগআউট করুন (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
