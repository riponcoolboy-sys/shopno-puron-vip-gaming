import React from 'react';

interface MegaWheelCanvasProps {
  rotationAngle?: number;
}

export interface WheelSegmentConfig {
  id: number;
  label: string;
  shortLabel?: string;
  type: 'FREE_SPIN' | 'MULTIPLIER' | 'CASH' | 'ZERO' | 'TRY_AGAIN' | 'MYSTERY';
  value: number; // multiplier, cash amount, or 0
  color: string;
  accentColor?: string;
  textColor?: string;
  icon?: string;
}

// Exactly 16 slots with high payout options & 2 Free Spins
export const WHEEL_SEGMENTS: WheelSegmentConfig[] = [
  { id: 0, label: 'FREE SPIN', shortLabel: 'FREE', type: 'FREE_SPIN', value: 0, color: '#f59e0b', accentColor: '#fbbf24', icon: '🎁' },
  { id: 1, label: '5 tk', type: 'CASH', value: 5, color: '#10b981', accentColor: '#34d399', icon: '৳' },
  { id: 2, label: '2x', type: 'MULTIPLIER', value: 2, color: '#3b82f6', accentColor: '#60a5fa', icon: '⚡' },
  { id: 3, label: '0 tk', type: 'ZERO', value: 0, color: '#dc2626', accentColor: '#ef4444', icon: '❌' },
  { id: 4, label: '20 tk', type: 'CASH', value: 20, color: '#ec4899', accentColor: '#f472b6', icon: '৳' },
  { id: 5, label: '3x', type: 'MULTIPLIER', value: 3, color: '#8b5cf6', accentColor: '#a78bfa', icon: '⚡' },
  { id: 6, label: 'Try Again', shortLabel: 'TRY', type: 'TRY_AGAIN', value: 0, color: '#4b5563', accentColor: '#6b7280', icon: '🔄' },
  { id: 7, label: '50 tk', type: 'CASH', value: 50, color: '#06b6d4', accentColor: '#22d3ee', icon: '৳' },
  { id: 8, label: 'FREE SPIN', shortLabel: 'FREE', type: 'FREE_SPIN', value: 0, color: '#eab308', accentColor: '#fde047', icon: '🎁' },
  { id: 9, label: '10 tk', type: 'CASH', value: 10, color: '#059669', accentColor: '#10b981', icon: '৳' },
  { id: 10, label: '5x', type: 'MULTIPLIER', value: 5, color: '#7c3aed', accentColor: '#8b5cf6', icon: '⚡' },
  { id: 11, label: '0 tk', type: 'ZERO', value: 0, color: '#b91c1c', accentColor: '#dc2626', icon: '❌' },
  { id: 12, label: '15 tk', type: 'CASH', value: 15, color: '#d97706', accentColor: '#f59e0b', icon: '৳' },
  { id: 13, label: 'Mystery Box', shortLabel: 'MYSTERY', type: 'MYSTERY', value: 0, color: '#be185d', accentColor: '#db2777', icon: '📦' },
  { id: 14, label: '100 tk', type: 'CASH', value: 100, color: '#047857', accentColor: '#10b981', icon: '👑' },
  { id: 15, label: 'Try Again', shortLabel: 'TRY', type: 'TRY_AGAIN', value: 0, color: '#374151', accentColor: '#4b5563', icon: '🔄' },
];

export default function MegaWheelCanvas({ rotationAngle = 0 }: MegaWheelCanvasProps) {
  const totalSegments = WHEEL_SEGMENTS.length; // 16
  const anglePerSegment = 360 / totalSegments; // 22.5 degrees

  return (
    <div className="relative w-full max-w-[280px] aspect-square mx-auto flex justify-center items-center select-none shrink-0 my-1">
      {/* Outer Glowing Gold Ring Frame with Bulbs */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 p-2 shadow-[0_0_25px_rgba(245,158,11,0.45),inset_0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-center">
        {/* Outer Rim Lights/Pins */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 22.5) * (Math.PI / 180);
          const r = 48.5; // percentage radius
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-100 border border-yellow-500 shadow-[0_0_6px_#fef08a] transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 120}ms` }}
            />
          );
        })}
      </div>

      {/* Top Pointer Indicator (Gold Arrow with Ruby Crystal) */}
      <div className="absolute -top-3.5 z-40 flex flex-col items-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-amber-300 relative">
          <div className="absolute -top-[24px] -left-[7.5px] w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-b from-red-500 to-red-700 rounded-full border border-amber-200 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        </div>
      </div>

      {/* Rotating Wheel Body */}
      <div
        className="w-[calc(100%-14px)] h-[calc(100%-14px)] rounded-full border border-yellow-200/90 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] transition-transform duration-[4200ms] cubic-bezier(0.12,0.95,0.22,1) relative z-10 overflow-hidden"
        style={{ transform: `rotate(${rotationAngle}deg)` }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full rounded-full">
          <defs>
            <radialGradient id="wheelHubGold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
            <filter id="shadow">
              <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.9" />
            </filter>
          </defs>

          {WHEEL_SEGMENTS.map((segment, index) => {
            const startAngle = index * anglePerSegment;
            const endAngle = (index + 1) * anglePerSegment;

            // Geometry Coordinates for Sector (center at 200, 200, radius 200)
            const x1 = 200 + 200 * Math.cos((Math.PI * startAngle) / 180);
            const y1 = 200 + 200 * Math.sin((Math.PI * startAngle) / 180);
            const x2 = 200 + 200 * Math.cos((Math.PI * endAngle) / 180);
            const y2 = 200 + 200 * Math.sin((Math.PI * endAngle) / 180);

            // Text coordinates placed at proper radius with clean padding
            const textAngle = startAngle + anglePerSegment / 2;
            const textRadius = segment.label.length > 8 ? 136 : 144;
            const textX = 200 + textRadius * Math.cos((Math.PI * textAngle) / 180);
            const textY = 200 + textRadius * Math.sin((Math.PI * textAngle) / 180);

            // Icon position closer to perimeter
            const iconRadius = 176;
            const iconX = 200 + iconRadius * Math.cos((Math.PI * textAngle) / 180);
            const iconY = 200 + iconRadius * Math.sin((Math.PI * textAngle) / 180);

            const isFreeSpin = segment.type === 'FREE_SPIN';
            const isMystery = segment.type === 'MYSTERY';

            return (
              <g key={index}>
                {/* Segment Wedge */}
                <path
                  d={`M 200 200 L ${x1} ${y1} A 200 200 0 0 1 ${x2} ${y2} Z`}
                  fill={segment.color}
                  stroke="#fbbf24"
                  strokeWidth="2"
                />

                {/* Inner decorative wedge stripe for Free Spin & High Rewards */}
                {(isFreeSpin || isMystery || segment.value >= 50 || segment.value === 5) && (
                  <path
                    d={`M 200 200 L ${200 + 190 * Math.cos((Math.PI * (startAngle + 3)) / 180)} ${200 + 190 * Math.sin((Math.PI * (startAngle + 3)) / 180)} A 190 190 0 0 1 ${200 + 190 * Math.cos((Math.PI * (endAngle - 3)) / 180)} ${200 + 190 * Math.sin((Math.PI * (endAngle - 3)) / 180)} Z`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                    opacity="0.6"
                  />
                )}

                {/* Pin divider tick */}
                <circle
                  cx={x1}
                  cy={y1}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#78350f"
                  strokeWidth="1.5"
                />

                {/* Segment Text - Scaled with dynamic 10px-11px font size & clean padding */}
                <text
                  x={textX}
                  y={textY}
                  fill={isFreeSpin ? "#000000" : "#ffffff"}
                  fontSize={segment.label.length > 8 ? "10" : segment.label.length > 4 ? "11" : "12"}
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing={segment.label.length > 8 ? "-0.2px" : "0"}
                  transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                  style={{ filter: isFreeSpin ? 'none' : 'drop-shadow(1px 1px 2px rgba(0,0,0,0.95))' }}
                >
                  {segment.label}
                </text>

                {/* Mini Pin Indicator on text line */}
                {isFreeSpin && (
                  <text
                    x={iconX}
                    y={iconY}
                    fontSize="11"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textAngle + 90}, ${iconX}, ${iconY})`}
                  >
                    ★
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Center Golden Hub (Royal VIP Center Piece) */}
        <div className="absolute inset-0 m-auto w-18 h-18 sm:w-20 sm:h-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-200 via-amber-400 to-amber-900 rounded-full border-2 sm:border-3 border-yellow-200 flex flex-col justify-center items-center shadow-[0_0_18px_rgba(0,0,0,0.9),inset_0_0_8px_rgba(255,255,255,0.7)] z-20">
          <div className="text-xs sm:text-sm leading-none">👑</div>
          <span className="text-[8px] sm:text-[9px] font-black text-black leading-tight text-center uppercase tracking-wider drop-shadow-sm mt-0.5">
            MEGA<br />WHEEL
          </span>
          <span className="text-[6px] font-bold text-amber-950 tracking-tighter leading-none">16 SLOTS</span>
        </div>
      </div>
    </div>
  );
}


