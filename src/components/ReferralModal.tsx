import React from 'react';
import ReferralDashboard from './ReferralDashboard';

interface ReferralModalProps {
  isOpen?: boolean;
  onClose: () => void;
  userId?: string;
  currentUser?: any;
  username?: string;
  wallet?: any;
  onOpenDeposit?: () => void;
}

export default function ReferralModal({
  isOpen = true,
  onClose,
  userId,
  currentUser,
  username,
  wallet,
  onOpenDeposit,
}: ReferralModalProps) {
  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg">
        <ReferralDashboard
          userId={userId}
          currentUser={currentUser}
          username={username}
          wallet={wallet}
          onClose={onClose}
          onOpenDeposit={onOpenDeposit}
          isModal={true}
        />
      </div>
    </div>
  );
}
