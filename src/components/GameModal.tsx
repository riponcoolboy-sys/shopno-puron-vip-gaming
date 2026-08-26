import React from 'react';
import { GameItem, UserWallet } from '../types';
import AviatorGame from './games/AviatorGame';
import CrazySevenSlots from './games/CrazySevenSlots';
import MegaWheelGame from './games/MegaWheelGame';
import BoxingKingGame from './games/BoxingKingGame';
import FortuneGemsGame from './games/FortuneGemsGame';
import EgyptianSlotGame from './games/EgyptianSlotGame';
import Baccarat from './games/Baccarat';
import SuperAceGame from './games/SuperAceGame';
import DragonTigerGame from './games/DragonTigerGame';
import CatalogMiniGame from './games/CatalogMiniGame';
import CanvasGame from './games/CanvasGame';

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
  const canvasGameIds = new Set([
    'super-ace-deluxe',
    'bounty-showdown',
    'super-elements',
    'garuda-500',
    'magic-ace-wild-lock',
    'circus-joker-4096',
    'gates-of-olympus',
    'jetx',
    'flyx',
    'crazy-time-wheel',
    'happy-fishing',
    'jackpot-fishing',
    'money-coming'
  ]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-0 flex flex-col justify-center">
        {canvasGameIds.has(game.id) ? (
          <CanvasGame
            title={game.title}
            gameId={game.id}
            balance={wallet.balance}
            userId={userId}
            color={game.color}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'boxing-king' ? (
          <BoxingKingGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'fortune-gems-3' ? (
          <FortuneGemsGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : (
          <CanvasGame
            title={game.title}
            gameId={game.id}
            balance={wallet.balance}
            userId={userId}
            color={game.color}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}