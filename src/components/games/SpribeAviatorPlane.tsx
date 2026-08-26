import React from 'react';

interface SpribeAviatorPlaneProps {
  x?: number | string;
  y?: number | string;
  style?: React.CSSProperties;
}

export default function SpribeAviatorPlane({ x = 0, y = 0, style }: SpribeAviatorPlaneProps) {
  const leftPos = typeof x === 'number' ? `${x}px` : x;
  const topPos = typeof y === 'number' ? `${y}px` : y;

  return (
    <div 
      className="absolute transition-all duration-75 ease-linear pointer-events-none z-30"
      style={{ 
        left: leftPos, 
        top: topPos,
        transform: 'translate(-50%, -50%) rotate(-12deg)',
        ...style
      }}
    >
      <div className="relative w-24 h-12 filter drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
        
        {/* ১. পেছনের ৩D রেড স্পীড ট্রেইল (Red Speed Lines) */}
        <div className="absolute top-1/2 -left-12 w-14 h-2 bg-gradient-to-l from-red-600 via-red-500 to-transparent blur-[1px] rounded-full animate-pulse" />
        <div className="absolute top-1/3 -left-8 w-10 h-0.5 bg-red-400 blur-[0.5px]" />
        <div className="absolute top-2/3 -left-10 w-12 h-0.5 bg-red-500 blur-[0.5px]" />

        {/* ২. অরিজিনাল ৩ডি স্পোর্টস জেট এয়ারপ্লেন (SVG) */}
        <svg viewBox="0 0 160 80" className="w-full h-full overflow-visible">
          <defs>
            {/* বডি গ্র্যাডিয়েন্ট (3D মেটালিক রেড) */}
            <linearGradient id="spribeRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="50%" stopColor="#d60000" />
              <stop offset="100%" stopColor="#660000" />
            </linearGradient>

            {/* ডানা ও শাইন গ্র্যাডিয়েন্ট */}
            <linearGradient id="wingShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6666" />
              <stop offset="100%" stopColor="#990000" />
            </linearGradient>

            {/* গ্লাস ককপিট */}
            <linearGradient id="glassCockpit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#88ccff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#003366" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* প্রধান বডি (Main Body Fuselage) */}
          <path 
            d="M 18 42 C 48 28, 106 28, 139 39 C 145 41, 145 43, 139 45 C 104 53, 48 54, 18 42 Z" 
            fill="url(#spribeRed)" 
          />

          {/* ককপিট গ্লাস (Glass Cockpit) */}
          <path 
            d="M 80 28 C 95 28, 115 34, 108 40 C 95 40, 80 34, 80 28 Z" 
            fill="url(#glassCockpit)" 
          />

          {/* মূল ডানা (Main Wing) */}
          <path 
            d="M 64 37 L 101 14 L 113 16 L 84 40 Z" 
            fill="url(#wingShine)" 
          />
          <path 
            d="M 67 44 L 99 64 L 110 61 L 83 42 Z" 
            fill="#880000" 
          />

          {/* লেজ (Tail Fin with 'X' Mark) */}
          <path 
            d="M 20 40 L 5 15 L 20 15 L 35 38 Z" 
            fill="#a80000" 
          />
          <text x="12" y="27" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">X</text>

          {/* 'Aviator' ব্র্যান্ডিং টেক্সট */}
          <text 
            x="70" 
            y="46" 
            fill="#ffffff" 
            fontSize="7" 
            fontWeight="bold" 
            fontStyle="italic"
            fontFamily="sans-serif"
            transform="rotate(-2, 70, 46)"
          >
            Aviator
          </text>

          {/* Compact front propeller with explicit spin animation. */}
          <g transform="translate(145 42)">
            <circle r="3.5" fill="#f8fafc" stroke="#991b1b" strokeWidth="1" />
            <g className="aviator-propeller">
              <path d="M 0 -3 C 10 -18, 13 -15, 5 -1 Z" fill="#fecaca" opacity="0.9" />
              <path d="M 0 3 C -10 18, -13 15, -5 1 Z" fill="#fecaca" opacity="0.9" />
            </g>
          </g>
        </svg>

        <style>{`@keyframes aviator-propeller-spin { to { transform: rotate(360deg); } } .aviator-propeller { transform-origin: 0 0; animation: aviator-propeller-spin 0.22s linear infinite; }`}</style>

      </div>
    </div>
  );
}
