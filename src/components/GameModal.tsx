// @ts-nocheck
import React from 'react';
import PixiSlotGame from './games/PixiSlotGame';

interface GameErrorBoundaryProps {
  onClose: () => void;
  children: React.ReactNode;
}

interface GameErrorBoundaryState {
  hasError: boolean;
}

class GameErrorBoundary extends React.Component<GameErrorBoundaryProps, GameErrorBoundaryState> {
  state: GameErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Game render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center gap-4 rounded-2xl bg-zinc-950 text-white border border-amber-500/40 p-6 text-center">
          <p className="text-sm font-bold text-amber-300">গেমটি লোড করা যায়নি</p>
          <button
            type="button"
            onClick={this.props.onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-sm"
          >
            ফিরে যান
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
        <GameErrorBoundary onClose={onClose}>
          <PixiSlotGame
            balance={Number(balance) || 0}
            onUpdateBalance={onUpdateBalance}
            onClose={onClose}
          />
        </GameErrorBoundary>
      </div>
    </div>
  );
}