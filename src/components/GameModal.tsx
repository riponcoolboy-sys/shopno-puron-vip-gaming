// @ts-nocheck
import React from 'react';
import PixiSlotGame from './games/PixiSlotGame';

interface GameModalProps {
  gameId: string;
  balance: number;
  onUpdateBalance: (
    newBalance: number,
    amountWonOrLost: number,
    type: 'BET' | 'WIN',
    description: string
  ) => void;
  onClose: () => void;
}

export default function GameModal({ gameId, balance = 0, onUpdateBalance, onClose }: GameModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-lg mx-auto h-[90vh] max-h-[800px] flex flex-col justify-between overflow-hidden relative rounded-2xl p-4">
        <PixiSlotGame
          balance={Number(balance) || 0}
          onUpdateBalance={onUpdateBalance}
          onClose={onClose}
        />
      </div>
    </div>
  );
}