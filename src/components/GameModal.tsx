// @ts-nocheck
import React from 'react';
import { GameItem, UserWallet } from '../types';
import PixiSlotGame from './games/PixiSlotGame';

interface GameModalProps {
  game: GameItem;
  wallet: UserWallet;
  userId?: string;
  onClose: () => void;
  onUpdateBalance: (amount: number) => void;
}

export default function GameModal({
  game,
  wallet,
  userId,
  onClose,
  onUpdateBalance,
}: GameModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-0 flex flex-col justify-center">
        <PixiSlotGame
          balance={wallet.balance}
          onUpdateBalance={onUpdateBalance}
          onClose={onClose}
        />
      </div>
    </div>
  );
}