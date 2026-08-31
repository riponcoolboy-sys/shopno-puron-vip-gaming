// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Flame,
  Gamepad2,
  Tv,
  Fish,
  Award,
  TrendingUp,
  LayoutGrid,
  Search,
  Users,
  Sparkles,
  ShieldAlert,
  Play,
  Zap,
} from 'lucide-react';
import {
  GameCategory,
  GameItem,
  Transaction,
  UserWallet,
  PaymentSettings,
  DepositRequest,
  User,
  PaymentGateway,
} from '../types';
import { GAMES_DATA } from '../data/games';
import { sounds } from '../utils/audio';
import { isAdminSession } from '../utils/security';
import Header from './Header';
import BannerSlider from './BannerSlider';
import BottomNav, { BottomNavTab } from './BottomNav';
import SidebarDrawer from './SidebarDrawer';
import GameModal from './GameModal';
import WalletModal from './WalletModal';
import VipRewardModal from './VipRewardModal';
import SupportModal from './SupportModal';
import ProfileModal from './ProfileModal';
import ReferralModal from './ReferralModal';
import MessagesModal from './MessagesModal';
import DownloadAppModal from './DownloadAppModal';
import LanguageModal from './LanguageModal';

interface UserLobbyProps {
  username: string;
  currentUser: User;
  wallet: UserWallet;
  transactions: Transaction[];
  paymentSettings: PaymentSettings;
  depositRequests: DepositRequest[];
  isMuted: boolean;
  onToggleMute: () => void;
  onLogout: () => void;
  onUpdateBalance: (
    newBalance: number,
    amountWonOrLost: number,
    type: 'BET' | 'WIN',
    description: string
  ) => void;
  onRequestDeposit: (data: {
    paymentMethod: PaymentGateway;
    amount: number;
    transactionId: string;
    senderNumber: string;
    bonusApplied: boolean;
  }) => void;
  onWithdraw: (
    amount: number,
    method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay',
    phone: string
  ) => boolean;
  onClaimVipReward: (amount: number, description: string) => void;
  onOpenAdmin?: () => void;
}

export default function UserLobby({
  username,
  currentUser,
  wallet,
  transactions,
  paymentSettings,
  depositRequests,
  isMuted,
  onToggleMute,
  onLogout,
  onUpdateBalance,
  onRequestDeposit,
  onWithdraw,
  onClaimVipReward,
  onOpenAdmin,
}: UserLobbyProps) {
  const safeUsername = typeof username === 'string' && username.trim() ? username : 'Player';
  const safeUser: User = {
    ...currentUser,
    _id: currentUser?._id || currentUser?.id || 'player-local',
    username: typeof currentUser?.username === 'string' && currentUser.username.trim()
      ? currentUser.username
      : safeUsername,
    phone: typeof currentUser?.phone === 'string' ? currentUser.phone : '',
    role: currentUser?.role === 'admin' ? 'admin' : 'player',
    balance: Number.isFinite(Number(currentUser?.balance)) ? Math.max(0, Number(currentUser.balance)) : 0,
  };
  const safeWallet: UserWallet = {
    ...wallet,
    balance: Number.isFinite(Number(wallet?.balance)) ? Math.max(0, Number(wallet.balance)) : safeUser.balance,
  };

  // Category state for the active 15-game catalog.
  const [activeCategory, setActiveCategory] = useState<string>('hot');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sortFeaturedGames = (games: typeof GAMES_DATA) => {
    const featuredId = 'garuda-slot';
    return [...games].sort((a, b) => {
      const aIsFeatured = a.id === featuredId ? 1 : 0;
      const bIsFeatured = b.id === featuredId ? 1 : 0;
      if (aIsFeatured !== bIsFeatured) return bIsFeatured - aIsFeatured;
      return 0;
    });
  };
  const [bottomNavTab, setBottomNavTab] = useState<BottomNavTab>('home');
  const [currentLanguage, setCurrentLanguage] = useState<'bn' | 'en'>('bn');

  useEffect(() => {
    try {
      if (typeof safeWallet.balance === 'number') {
        localStorage.setItem('SHOPNO_PURON_BALANCE_V2', String(safeWallet.balance));
        localStorage.setItem('shopno_puron_balance', String(safeWallet.balance));
        localStorage.setItem('user_balance', String(safeWallet.balance));
      }
      if (safeUser.username) {
        localStorage.setItem(
          'SHOPNO_PURON_USER_V2',
          JSON.stringify({ ...safeUser, balance: safeWallet.balance })
        );
      }
    } catch (error) {
      console.warn('Lobby storage update failed:', error);
    }
  }, [safeUser, safeWallet.balance]);

  // Modals & Drawers States
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [showWallet, setShowWallet] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showReferral, setShowReferral] = useState<boolean>(false);
  const [showVipModal, setShowVipModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [showMessagesModal, setShowMessagesModal] = useState<boolean>(false);
  const [showDownloadAppModal, setShowDownloadAppModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);

  const handleLaunchGame = (gameId: string) => {
    sounds.playClick();
    const game = GAMES_DATA.find((g) => g.id === gameId) || GAMES_DATA[0];
    setSelectedGame(game);
  };

  // Horizontal category bar for the active 15-game catalog.
  const categoriesList = [
    { id: 'hot', label: currentLanguage === 'bn' ? 'গরম / হট' : 'Goram / Hot', icon: Flame },
    { id: 'slots', label: currentLanguage === 'bn' ? 'স্লট' : 'Slot', icon: Gamepad2 },
    { id: 'live', label: currentLanguage === 'bn' ? 'লাইভ' : 'Live', icon: Tv },
    { id: 'fishing', label: currentLanguage === 'bn' ? 'ফিশিং' : 'Fishing', icon: Fish },
    { id: 'all', label: currentLanguage === 'bn' ? 'সব' : 'All', icon: LayoutGrid },
  ];

  // Filter games based on selected category & search query
  const filteredGames = sortFeaturedGames(GAMES_DATA.filter((game) => {
    let matchesCategory = true;
    if (activeCategory !== 'all') matchesCategory = game.category === activeCategory;

    const matchesSearch =
      searchQuery.trim() === '' ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.titleBn.includes(searchQuery) ||
      game.provider.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  }));

  const canReturnToAdmin = Boolean(
    onOpenAdmin &&
      (safeUser.role === 'admin' || isAdminSession() || localStorage.getItem('user_role') === 'admin' || !!localStorage.getItem('admin_token'))
  );

  return (
    <div className="h-screen w-full flex bg-[#0B0E14] text-gray-100 font-sans overflow-hidden selection:bg-[#FFC700] selection:text-black">
      {/* 1. Slide-out Left Sidebar Drawer */}
      <SidebarDrawer
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        currentUser={safeUser}
        username={safeUser.username}
        wallet={safeWallet}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onNavigateHome={() => {
          setBottomNavTab('home');
          setActiveCategory('hot');
        }}
        onOpenInvite={() => setShowReferral(true)}
        onOpenMessages={() => setShowMessagesModal(true)}
        onOpenDownloadApp={() => setShowDownloadAppModal(true)}
        onOpenVip={() => setShowVipModal(true)}
        onOpenRewards={() => setShowVipModal(true)}
        onOpenSupport={() => setShowSupportModal(true)}
        onOpenLanguage={() => setShowLanguageModal(true)}
        onOpenDeposit={() => setShowWallet(true)}
        onOpenAdmin={onOpenAdmin}
        onLogout={onLogout}
        currentLanguage={currentLanguage}
      />

      {/* 2. Desktop Permanent Sidebar (optional luxury display for large screens) */}
      <aside className="w-64 flex-shrink-0 bg-[#0E121A] border-r border-[#FFC700]/15 flex flex-col justify-between hidden lg:flex">
        <div>
          {/* Brand Logo */}
          <div className="p-5 border-b border-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-[#FFC700] rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#FFC700]/20 to-amber-400/10 shadow-[0_0_15px_rgba(255,199,0,0.3)]">
                <span className="text-2xl text-[#FFC700]">👑</span>
              </div>
              <div>
                <h1 className="text-lg font-black italic tracking-wider text-[#FFC700] leading-none">
                  SHOPNO PURON
                </h1>
                <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-1 font-bold">
                  ROYAL VIP CASINO
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Nav Categories */}
          <nav className="p-3 space-y-1.5">
            <div className="text-[10px] font-bold text-gray-400 px-3 uppercase tracking-wider mb-2">
              গেম ক্যাটাগরি
            </div>
            {categoriesList.map((item) => {
              const Icon = item.icon;
              const isActive = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.playClick();
                    setActiveCategory(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#FFC700] text-black shadow-[0_4px_12px_rgba(255,199,0,0.25)] font-black'
                      : 'text-gray-300 hover:text-white hover:bg-[#151C2C]'
                  }`}
                >
                  <Icon size={17} className={isActive ? 'text-black' : 'text-[#FFC700]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Admin Switch */}
            {safeUser.role === 'admin' && onOpenAdmin && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-950/70 border border-purple-800 text-purple-300 hover:bg-purple-900 transition"
                >
                  <ShieldAlert size={17} className="text-purple-400" />
                  <span>এডমিন কন্ট্রোল সেন্টার</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Quick Deposit Banner */}
        <div className="p-3">
          <div className="bg-gradient-to-b from-[#151C2C] to-[#0D121D] border border-[#FFC700]/30 rounded-2xl p-3.5 text-center relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#FFC700]/20 flex items-center justify-center mx-auto mb-2 text-[#FFC700]">
              <Sparkles size={16} />
            </div>
            <h4 className="text-xs font-black text-[#FFC700]">১০০% ওয়েলকাম বোনাস</h4>
            <p className="text-[10px] text-gray-400 mt-1">bKash বা Nagad এ ডিপোজিট করে পান দ্বিগুণ ব্যালেন্স</p>
            <button
              onClick={() => {
                sounds.playClick();
                setShowWallet(true);
              }}
              className="mt-2.5 w-full bg-[#FFC700] hover:brightness-110 text-black text-xs font-black py-2 rounded-xl transition shadow"
            >
              ডিপোজিট করুন ➔
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Main Center Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          username={safeUser.username}
          currentUser={safeUser}
          wallet={safeWallet}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          onOpenDeposit={() => setShowWallet(true)}
          onOpenVipRewards={() => setShowVipModal(true)}
          onOpenSidebar={() => setShowSidebar(true)}
          onOpenMessages={() => setShowMessagesModal(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenAdmin={onOpenAdmin}
          onLogout={onLogout}
        />

        {/* Scrollable Center Hub */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 no-scrollbar bg-[#0B0E14]">
          <div className="p-2.5 sm:p-4 max-w-7xl mx-auto space-y-3.5">
            {/* Banner Slider */}
            <BannerSlider
              onPlayGame={(gameId) => handleLaunchGame(gameId)}
              onOpenDeposit={() => setShowWallet(true)}
              onOpenVipRewards={() => setShowVipModal(true)}
            />

            {/* Horizontal category bar for the active 15-game catalog */}
            <div className="sticky top-0 z-20 bg-[#0B0E14]/95 backdrop-blur-md py-1 -mx-2.5 sm:-mx-4 px-2.5 sm:px-4 border-b border-[#FFC700]/10">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                {categoriesList.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        sounds.playClick();
                        setActiveCategory(cat.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
                        isActive
                          ? 'bg-[#FFC700] text-black font-black shadow-[0_2px_10px_rgba(255,199,0,0.3)] scale-[1.02]'
                          : 'bg-[#121724] border border-gray-800 text-gray-300 hover:text-white hover:border-[#FFC700]/30'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-black' : 'text-[#FFC700]'} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Quick Filters Row */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="গেম সার্চ করুন (Aviator, Gems, Baccarat, Poker...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121724] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#FFC700] transition font-medium"
                />
              </div>

              <button
                onClick={() => setShowSupportModal(true)}
                className="bg-[#121724] border border-gray-800 hover:border-[#FFC700]/40 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition flex items-center gap-1.5 flex-shrink-0"
              >
                <Users size={14} className="text-[#FFC700]" />
                <span className="hidden sm:inline">লাইভ সাপোর্ট</span>
              </button>
            </div>

            {/* Dynamic 3-Column Game Grid Layout */}
            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Flame size={16} className="text-[#FFC700] animate-pulse" />
                  <span>
                    {categoriesList.find((c) => c.id === activeCategory)?.label || 'জনপ্রিয় গেমস'}
                  </span>
                  <span className="text-[10px] bg-[#121724] border border-gray-800 text-[#FFC700] font-mono font-bold px-2 py-0.2 rounded-full">
                    {filteredGames.length} গেম
                  </span>
                </h3>
              </div>

              {/* Dynamic 3-Column Game Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {filteredGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => handleLaunchGame(game.id)}
                    className="group relative bg-[#121724] border border-gray-800/80 hover:border-[#FFC700] rounded-xl p-1.5 sm:p-2 cursor-pointer transition transform hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.7)] flex flex-col justify-between overflow-hidden"
                  >
                    {/* Game Thumbnail */}
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-1.5 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                      <img
                        src={game.image || game.coverImage}
                        alt={game.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                      />

                      {/* Badges (HOT, VIP, JACKPOT, NEW, POPULAR) */}
                      {game.tag && (
                        <span
                          className={`absolute top-1 left-1 text-white text-[8px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider shadow ${
                            game.tag === 'HOT'
                              ? 'bg-gradient-to-r from-red-600 to-orange-500'
                              : game.tag === 'JACKPOT'
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black'
                              : game.tag === 'VIP'
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                          }`}
                        >
                          {game.tag}
                        </span>
                      )}

                      {/* Hover Overlay with Neon Gold PLAY Button */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-[#FFC700] text-black font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-lg shadow-lg transform group-hover:scale-105 transition flex items-center gap-1">
                          <Play size={10} className="fill-black" />
                          <span>খেলুন</span>
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase">
                        <span className="truncate max-w-[55px] text-[#FFC700]">{game.provider}</span>
                        <span className="text-emerald-400 font-mono">RTP {game.rtp}</span>
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-black text-gray-100 truncate group-hover:text-[#FFC700] transition">
                        {game.title}
                      </h4>
                      <p className="text-[9px] text-gray-400 truncate hidden sm:block">
                        {game.titleBn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* 4. Fixed 5-Item Bottom Menu (Home, Refer, Promotions, Support, Profile) */}
        <BottomNav
          activeTab={bottomNavTab}
          onSelectTab={(tab) => setBottomNavTab(tab)}
          onNavigateHome={() => {
            setBottomNavTab('home');
            setActiveCategory('hot');
          }}
          onOpenRefer={() => setShowReferral(true)}
          onOpenPromotions={() => setShowVipModal(true)}
          onOpenSupport={() => setShowSupportModal(true)}
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>

      {/* MODALS */}
      {/* Game Modal */}
      {selectedGame && (
        <GameModal
          gameId={selectedGame.id}
          balance={safeWallet.balance}
          onClose={() => setSelectedGame(null)}
          onUpdateBalance={onUpdateBalance}
        />
      )}

      {/* Profile & Member Withdrawal Modal */}
      {showProfile && (
        <ProfileModal
          isOpen={showProfile}
          user={safeUser}
          balance={safeWallet.balance}
          currentUser={safeUser}
          username={safeUser.username}
          wallet={safeWallet}
          transactions={transactions}
          onClose={() => setShowProfile(false)}
          onOpenDeposit={() => setShowWallet(true)}
          onOpenReferral={() => setShowReferral(true)}
          onOpenRewards={() => setShowVipModal(true)}
          onOpenSupport={() => setShowSupportModal(true)}
          onOpenAdmin={onOpenAdmin}
          onWithdraw={onWithdraw}
          onLogout={onLogout}
        />
      )}

      {/* Referral / Invite Modal */}
      {showReferral && (
        <ReferralModal
          isOpen={showReferral}
          userId={safeUser._id || safeUser.id || safeUser.username || 'VIP123'}
          currentUser={safeUser}
          username={safeUser.username}
          wallet={safeWallet}
          onClose={() => setShowReferral(false)}
          onOpenDeposit={() => setShowWallet(true)}
        />
      )}

      {/* Deposit / Withdraw Wallet Modal */}
      {showWallet && (
        <WalletModal
          wallet={wallet}
          transactions={transactions}
          paymentSettings={paymentSettings}
          depositRequests={depositRequests}
          onClose={() => setShowWallet(false)}
          onSubmitDeposit={onRequestDeposit}
          onWithdraw={onWithdraw}
        />
      )}

      {/* VIP & Daily Rewards Modal */}
      {showVipModal && (
        <VipRewardModal
          wallet={wallet}
          onClose={() => setShowVipModal(false)}
          onClaimReward={onClaimVipReward}
        />
      )}

      {/* 24/7 Live Support Modal */}
      {showSupportModal && (
        <SupportModal onClose={() => setShowSupportModal(false)} />
      )}

      {/* Messages / Notifications Modal */}
      {showMessagesModal && (
        <MessagesModal
          isOpen={showMessagesModal}
          onClose={() => setShowMessagesModal(false)}
          onOpenDeposit={() => setShowWallet(true)}
          onOpenVip={() => setShowVipModal(true)}
        />
      )}

      {/* Download Mobile App Modal */}
      {showDownloadAppModal && (
        <DownloadAppModal
          isOpen={showDownloadAppModal}
          onClose={() => setShowDownloadAppModal(false)}
        />
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <LanguageModal
          isOpen={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
          currentLanguage={currentLanguage}
          onSelectLanguage={(lang) => setCurrentLanguage(lang)}
        />
      )}
    </div>
  );
}
