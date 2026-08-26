export type GameCategory = 'all' | 'hot' | 'slots' | 'live' | 'poker' | 'sports' | 'crash' | 'table' | 'fishing';

export interface GameItem {
  id: string;
  title: string;
  titleBn: string;
  provider: string;
  category: GameCategory;
  rtp: string;
  tag?: 'HOT' | 'NEW' | 'JACKPOT' | 'VIP' | 'POPULAR';
  color: string;
  accentColor: string;
  minBet: number;
  maxBet: number;
  playersCount: number;
  iconName: string;
  coverImage: string;
  description: string;
}

// User Schema (সেপারেট এক্সেস রোল: player / admin)
export interface User {
  id?: string;
  _id?: string;
  username: string;
  phone: string;
  email?: string;
  password?: string;
  role: 'player' | 'admin';
  balance: number;
  vipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  points?: number;
  token?: string;
  isBanned?: boolean;
  totalDeposits?: number;
  totalWithdrawals?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWallet {
  balance: number;
  currency: string;
  vipTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  points: number;
  totalWon: number;
  totalBets: number;
}

export type PaymentGateway = 'bkash' | 'nagad' | 'rocket' | 'sendmoney' | 'usdt' | 'bank';

// PaymentSettings Schema (এডমিনের পেমেন্ট নম্বর সেভ করার জন্য)
export interface PaymentSettings {
  id?: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber?: string;
  sendMoneyNumber?: string;
  usdtAddress?: string;
  usdtNetwork?: string;
  bankAccountNumber: string;
  bankNameDetails: string;
  updatedAt?: string;
}

// Deposit Schema (ইউজারের ডিপোজিট রিকোয়েস্ট সেভ করার জন্য)
export interface DepositRequest {
  id: string;
  _id?: string;
  userId: string;
  userName?: string;
  paymentMethod: PaymentGateway;
  amount: number;
  transactionId: string;
  senderNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  bonusApplied?: boolean;
  bonusAmount?: number;
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string;
}

// Withdraw Schema (উইথড্র রিকোয়েস্ট সেভ করার জন্য)
export interface WithdrawRequest {
  id: string;
  _id?: string;
  userId: string;
  userName?: string;
  paymentMethod: string;
  amount: number;
  accountNumber: string;
  trxId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'WIN' | 'BET' | 'VIP_BONUS' | 'ADMIN_ADJUST';
  method?: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp: string;
  trxId?: string;
  gameTitle?: string;
  userName?: string;
  userId?: string;
  note?: string;
}

export interface AdminStats {
  totalDeposits: number;
  totalWithdrawals: number;
  netProfit: number;
  activePlayers: number;
  pendingApprovals: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  currentRTP: number;
  rtpMode: 'high_profit' | 'standard' | 'loose';
}

export interface RTPConfig {
  targetRtp: number; // 80 - 98
  mode: 'high_profit' | 'standard' | 'loose';
  streakProtection: boolean;
  maxPayoutMultiplier: number;
  isDrainActive?: boolean;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'support' | 'bot';
  text: string;
  time: string;
}
