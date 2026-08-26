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
  onUpdateBalance: (newBalance: number, amountWonOrLost: number, type: 'BET' | 'WIN', description: string) => void;
}

export default function GameModal({
  game,
  wallet,
  userId,
  onClose,
  onUpdateBalance,
}: GameModalProps) {
  const canvasGameIds = new Set([
    'super-ace-deluxe', 'bounty-showdown', 'super-elements', 'fortune-gems-3',
    'garuda-500', 'magic-ace-wild-lock', 'circus-joker-4096', 'money-coming',
    'gates-of-olympus', 'jetx', 'flyx', 'crazy-time-wheel', 'happy-fishing', 'jackpot-fishing',
  ]);
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-3 z-50 overflow-y-auto animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-0 flex flex-col justify-between">
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
        ) : game.id === 'egyptian-slots' ? (
          <EgyptianSlotGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'super-ace' ? (
          <SuperAceGame
            balance={wallet.balance}
            userId={userId}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'dragon-tiger' ? (
          <DragonTigerGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'baccarat' || game.category === 'table' ? (
          <Baccarat
            currentBalance={wallet.balance}
            balance={wallet.balance}
            userId={userId}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'fortune-gems' ? (
          <FortuneGemsGame
            balance={wallet.balance}
            userId={userId}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'aviator-2' ? (
          <AviatorGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'crazy-seven' ? (
          <CrazySevenSlots
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'mega-wheel' ? (
          <MegaWheelGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : game.id === 'boxing-king' ? (
          <BoxingKingGame
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        ) : (
          <CatalogMiniGame
            title={game.title}
            balance={wallet.balance}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
