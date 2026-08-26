import React from 'react';
import { Home, UserPlus, Gift, Headphones, User, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

export type BottomNavTab = 'home' | 'refer' | 'promotions' | 'support' | 'profile';

interface BottomNavProps {
  activeTab?: BottomNavTab;
  onSelectTab?: (tab: BottomNavTab) => void;
  // Specific direct action triggers
  onNavigateHome?: () => void;
  onOpenRefer?: () => void;
  onOpenPromotions?: () => void;
  onOpenSupport?: () => void;
  onOpenProfile?: () => void;
}

export default function BottomNav({
  activeTab = 'home',
  onSelectTab,
  onNavigateHome,
  onOpenRefer,
  onOpenPromotions,
  onOpenSupport,
  onOpenProfile,
}: BottomNavProps) {
  const handleTabClick = (tab: BottomNavTab) => {
    sounds.playClick();
    if (onSelectTab) {
      onSelectTab(tab);
    }

    if (tab === 'home' && onNavigateHome) {
      onNavigateHome();
    } else if (tab === 'refer' && onOpenRefer) {
      onOpenRefer();
    } else if (tab === 'promotions' && onOpenPromotions) {
      onOpenPromotions();
    } else if (tab === 'support' && onOpenSupport) {
      onOpenSupport();
    } else if (tab === 'profile' && onOpenProfile) {
      onOpenProfile();
    }
  };

  const navItems = [
    {
      id: 'home' as const,
      label: 'হোম (Home)',
      icon: Home,
      isCenter: false,
    },
    {
      id: 'refer' as const,
      label: 'রেফার (Refer)',
      icon: UserPlus,
      isCenter: false,
    },
    {
      id: 'promotions' as const,
      label: 'অফার (Promo)',
      icon: Gift,
      isCenter: true, // Center highlighted button
    },
    {
      id: 'support' as const,
      label: 'সহায়তা (Support)',
      icon: Headphones,
      isCenter: false,
    },
    {
      id: 'profile' as const,
      label: 'প্রোফাইল (Profile)',
      icon: User,
      isCenter: false,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0B0E14]/95 backdrop-blur-md border-t border-[#FFC700]/20 text-gray-400 py-1.5 px-2 z-40">
      <div className="flex justify-around items-center max-w-lg mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <div key={item.id} className="flex-1 flex justify-center -mt-6">
                <button
                  onClick={() => handleTabClick(item.id)}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#FFC700] via-amber-400 to-yellow-300 text-[#0B0E14] flex flex-col items-center justify-center shadow-[0_0_18px_rgba(255,199,0,0.5)] border-2 border-[#0B0E14] scale-105 active:scale-95 transition cursor-pointer group"
                >
                  <Icon size={20} className="stroke-[2.5] group-hover:scale-110 transition" />
                  <span className="text-[8px] font-black uppercase mt-0.5 tracking-tighter">
                    PROMO
                  </span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
                isActive
                  ? 'text-[#FFC700] font-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FFC700]" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight whitespace-nowrap">
                {item.id === 'home'
                  ? 'Home'
                  : item.id === 'refer'
                  ? 'Refer'
                  : item.id === 'support'
                  ? 'Support'
                  : 'Profile'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
