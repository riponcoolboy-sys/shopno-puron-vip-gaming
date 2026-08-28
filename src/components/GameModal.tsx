// @ts-nocheck
import React from 'react';
import PixiSlotGame from './games/PixiSlotGame';

interface GameModalProps {
  gameId: string;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  onClose: () => void;
}

export default function GameModal({ gameId, balance, onUpdateBalance, onClose }: GameModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        {/* শুধুমাত্র আমাদের নতুন স্লট গেমটি লোড হবে */}
        <PixiSlotGame 
          balance={balance} 
          onUpdateBalance={onUpdateBalance} 
          onClose={onClose} 
        />
      </div>
    </div>
  );
}