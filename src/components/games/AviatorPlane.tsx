import React, { useState } from 'react';

// সুন্দর প্লেনের SVG (লাল রঙের স্পোর্টি ডিজাইন - ফলব্যাক হিসেবে)
export const PlaneIcon: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" 
      fill="#FF3333" 
      stroke="#990000" 
      strokeWidth="0.5"
    />
  </svg>
);

interface AviatorPlaneProps {
  planeX?: number | string;
  planeY?: number | string;
  currentX?: string | number;
  currentY?: string | number;
  x?: string | number;
  y?: string | number;
  isFlying?: boolean;
  src?: string;
  className?: string;
  style?: React.CSSProperties;
}

const AviatorPlane: React.FC<AviatorPlaneProps> = ({ 
  planeX,
  planeY,
  currentX, 
  currentY, 
  x, 
  y, 
  isFlying = true,
  src = 'https://i.ibb.co/Xkz6ptFB/plane.png',
  className = '',
  style 
}) => {
  const [imgError, setImgError] = useState(false);

  // বিমান যদি না ওড়ে (যেমন Crash বা Waiting মোডে), তবে দেখাবে না
  if (!isFlying) return null;

  const posX = planeX !== undefined
    ? (typeof planeX === 'number' ? `${planeX}%` : planeX)
    : currentX !== undefined 
      ? (typeof currentX === 'number' ? `${currentX}%` : currentX) 
      : (x !== undefined ? (typeof x === 'number' ? `${x}%` : x) : '10%');

  const posY = planeY !== undefined
    ? (typeof planeY === 'number' ? `${planeY}%` : planeY)
    : currentY !== undefined 
      ? (typeof currentY === 'number' ? `${currentY}%` : currentY) 
      : (y !== undefined ? (typeof y === 'number' ? `${y}%` : y) : '10%');

  return (
    <div 
      className={`plane-container absolute pointer-events-none z-10 ${className}`}
      style={{
        position: 'absolute',
        left: posX,
        bottom: posY,
        transform: 'translate(-50%, 50%)',
        transition: 'all 0.1s linear',
        zIndex: 10,
        ...style
      }}
    >
      {!imgError ? (
        <img 
          src={src}
          alt="Aviator Plane"
          onError={() => setImgError(true)}
          style={{
            width: '55px',
            height: 'auto',
            filter: 'drop-shadow(0px 4px 8px rgba(255, 0, 0, 0.5))'
          }}
        />
      ) : (
        <div style={{ width: '48px', height: '48px', filter: 'drop-shadow(0px 4px 8px rgba(255, 0, 0, 0.5))' }}>
          <PlaneIcon />
        </div>
      )}
    </div>
  );
};

// ১. নতুন প্লেন ইমেজ লোড করা (কোডের উপরে বা ফাইলে আলাদাভাবে রাখুন)
export const planeImg: HTMLImageElement | null = typeof window !== 'undefined' ? new Image() : null;
if (planeImg) {
  planeImg.src = "https://i.ibb.co/Xkz6ptFB/plane.png";
}

// ২. ক্যানভাসে আঁকার ফাংশন (drawPlane / render)
export function drawPlane(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number = 50, 
  height: number = 50
) {
  if (planeImg && planeImg.complete && planeImg.naturalWidth !== 0) {
    // প্লেনের সাইজ ক্যানভাসে ৫০x৫০ পিক্সেল করে দেওয়া হলো
    ctx.drawImage(planeImg, x - 25, y - 25, 50, 50);
  }
}

export default AviatorPlane;


