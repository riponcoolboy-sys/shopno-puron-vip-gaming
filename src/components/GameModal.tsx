// @ts-nocheck
import React from 'react';
import { GameItem, UserWallet } from '../types';
import AviatorGame from './games/AviatorGame';
import CrazySevenSlots from './games/CrazySevenSlots';
import MegaWheelGame from './games/MegaWheelGame';
import BoxingKingGame from './games/BoxingKingGame';
import FortuneGemsGame from './games/FortuneGemsGame';
import FortuneGems from './games/FortuneGems';
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
  const renderGameComponent = (): React.ReactNode => {
    switch (game.id) {
      case 'super-ace-deluxe':
      case 'super-ace':
        return (
          <SuperAceGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        );

      case 'boxing-king':
        return (
          <BoxingKingGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        );

      case 'fortune-garuda-500':
      case 'fortune-garuda':
      case 'fortune-gems-3':
      case 'fortune-gems':
        return (
          <FortuneGems
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        );

      case 'jetx':
      case 'flyx':
      case 'aviator':
        return (
          <AviatorGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        );

      case 'circus-joker-4096':
        return (
          <CrazySevenSlots
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        );

      case 'crazy-time-wheel':
        return (
          <MegaWheelGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        );

      default:
        return (
          <CanvasGame
            title={game.title}
            gameId={game.id}
            balance={wallet.balance}
            userId={userId}
            color={game.color}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-0 flex flex-col justify-center">
        {renderGameComponent()}
      </div>
    </div>
  );
}