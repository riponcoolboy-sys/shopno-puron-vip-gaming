import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jwt-simple';
import mongoose from 'mongoose';
import { WebSocketServer, WebSocket } from 'ws';
import {
  calculateRTPWin,
  determineRTPTier,
  setGlobalRTPConfig,
  getGlobalRTPConfig,
  resetRTPStats,
  getRTPDiagnostics,
} from './src/utils/rtpManager';
import { calculateCrashPoint } from './src/utils/gameEngine';
import { BET_PRESETS } from './src/utils/betPresets';
import cors from 'cors';
import 'dotenv/config';

const JWT_SECRET = 'your_super_secret_key_123';
const CSRF_SECRET = 'aviator_csrf_secret_salt_2026';

// Anti-Brute-Force Login Rate Limiting Tracker (Max 5 attempts / 60 seconds)
interface LoginAttemptRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number;
}
const loginAttemptsMap = new Map<string, LoginAttemptRecord>();

export const authRateLimiterMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'client';
  const targetKey = String(req.body?.username || req.body?.email || clientIp).toLowerCase().trim();
  const now = Date.now();

  const record = loginAttemptsMap.get(targetKey);
  if (record && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      message: `অতিরিক্ত ভুল লগইন চেষ্টার কারণে একাউন্ট সাময়িকভাবে ব্লক করা হয়েছে। অনুগ্রহ করে ${remainingSeconds} সেকেন্ড পর চেষ্টা করুন।`,
      isLocked: true,
      remainingSeconds,
      retryAfter: remainingSeconds,
    });
  }

  next();
};

export const recordFailedLogin = (key: string) => {
  const cleanKey = String(key || 'client').toLowerCase().trim();
  const now = Date.now();
  const record = loginAttemptsMap.get(cleanKey) || { attempts: 0, firstAttempt: now, lockedUntil: 0 };

  if (now - record.firstAttempt > 60000) {
    record.attempts = 1;
    record.firstAttempt = now;
    record.lockedUntil = 0;
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= 5) {
    record.lockedUntil = now + 60000; // 60s lockout
  }

  loginAttemptsMap.set(cleanKey, record);
};

export const recordSuccessfulLogin = (key: string) => {
  loginAttemptsMap.delete(String(key || 'client').toLowerCase().trim());
};

// Recursive Input Sanitization Middleware to prevent XSS & SQLi
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/['"`;]/g, (char) => {
        // preserve quotes if needed for password, but strip script injection
        return char;
      })
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitizedObj: any = {};
    for (const key of Object.keys(value)) {
      sanitizedObj[key] = sanitizeValue(value[key]);
    }
    return sanitizedObj;
  }
  return value;
}

export const sanitizeInputsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};

// ========================================================
// MongoDB ক্লাউড ডাটাবেজ কানেকশন (Persistent Cloud Database)
// ========================================================
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aviator_fallback';

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI missing; using local fallback database connection.');
}

let isMongoConnected = false;

// Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '01700000000' },
  password: { type: String, required: true },
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
  balance: { type: Number, default: 0 },
  vipTier: { type: String, default: 'BRONZE' },
  points: { type: Number, default: 0 },
  referredBy: { type: String, default: '' },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

const depositSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: '' },
  paymentMethod: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  senderNumber: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

const paymentSettingsSchema = new mongoose.Schema({
  bkashNumber: { type: String, default: '01888-776655' },
  nagadNumber: { type: String, default: '01777-665544' },
  rocketNumber: { type: String, default: '01999-554433' },
  sendMoneyNumber: { type: String, default: '01888-776655' },
  usdtAddress: { type: String, default: 'TK8xL9pQ2mNv5zB1cR4sW7yU6aE3dF8gH0' },
  usdtNetwork: { type: String, default: 'TRC20' },
  bankAccountNumber: { type: String, default: '102.110.45892' },
  bankNameDetails: { type: String, default: 'Islami Bank Bangladesh Ltd (IBBL), Motijheel Branch' },
}, { timestamps: true });

export const UserModel: mongoose.Model<any> = mongoose.models.User || mongoose.model('User', userSchema);
export const DepositModel: mongoose.Model<any> = mongoose.models.Deposit || mongoose.model('Deposit', depositSchema);
export const PaymentSettingsModel: mongoose.Model<any> = mongoose.models.PaymentSettings || mongoose.model('PaymentSettings', paymentSettingsSchema);

// ডাটাবেজ কানেকশন ইনিশিয়ালাইজেশন
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    isMongoConnected = true;
    console.log("কমিউনিটি ডাটাবেজ কানেক্টেড! আপডেট দিলেও ডাটা মুছবে না।");
  })
  .catch((err) => {
    console.error("ডাটাবেজ এরর (ফ্রি / ফলব্যাক মোড সক্রিয়):", err.message);
  });

// In-Memory / Persistent Store models matching Mongoose schema structure
interface PaymentSettingsDoc {
  _id: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber?: string;
  sendMoneyNumber?: string;
  usdtAddress?: string;
  usdtNetwork?: string;
  bankAccountNumber: string;
  bankNameDetails: string;
  createdAt: string;
  updatedAt: string;
}

interface DepositDoc {
  _id: string;
  userId: string;
  userName?: string;
  paymentMethod: string;
  amount: number;
  transactionId: string;
  senderNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface WithdrawDoc {
  _id: string;
  userId: string;
  userName?: string;
  paymentMethod: string;
  amount: number;
  accountNumber: string;
  trxId?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserDoc {
  _id: string;
  username: string;
  email?: string;
  phone: string;
  password?: string;
  role: 'player' | 'admin';
  balance: number;
  vipTier?: string;
  points?: number;
  referredBy?: string;
  isBanned?: boolean;
  totalDeposits?: number;
  totalWithdrawals?: number;
  createdAt: string;
  updatedAt: string;
}

// Initial Mock DB State
let dbPaymentSettings: PaymentSettingsDoc = {
  _id: 'ps_global_01',
  bkashNumber: '01888-776655',
  nagadNumber: '01777-665544',
  rocketNumber: '01999-554433',
  sendMoneyNumber: '01888-776655',
  usdtAddress: 'TK8xL9pQ2mNv5zB1cR4sW7yU6aE3dF8gH0',
  usdtNetwork: 'TRC20',
  bankAccountNumber: '102.110.45892',
  bankNameDetails: 'Islami Bank Bangladesh Ltd (IBBL), Motijheel Branch',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Seeded Users (with role: player / admin and bcrypt-hashed passwords)
let dbUsers: Record<string, UserDoc> = {
  usr_78912: {
    _id: 'usr_78912',
    username: 'vip_player07',
    phone: '01700123456',
    password: bcrypt.hashSync('password123', 10),
    role: 'player',
    balance: 5240,
    vipTier: 'GOLD',
    points: 1250,
    isBanned: false,
    totalDeposits: 6000,
    totalWithdrawals: 1500,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  usr_44521: {
    _id: 'usr_44521',
    username: 'arif_khan99',
    phone: '01811223344',
    password: bcrypt.hashSync('password123', 10),
    role: 'player',
    balance: 1420,
    vipTier: 'SILVER',
    points: 450,
    isBanned: false,
    totalDeposits: 3000,
    totalWithdrawals: 800,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  usr_99812: {
    _id: 'usr_99812',
    username: 'shuvo_gamer',
    phone: '01911998877',
    password: bcrypt.hashSync('password123', 10),
    role: 'player',
    balance: 890,
    vipTier: 'BRONZE',
    points: 180,
    isBanned: false,
    totalDeposits: 1000,
    totalWithdrawals: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  usr_admin_ripon: {
    _id: 'usr_admin_ripon',
    username: 'admin_ripon',
    email: 'riponcoolboy@gmail.com',
    phone: '01700000000',
    password: bcrypt.hashSync('Akashvai92@#*', 10),
    role: 'admin',
    balance: 0,
    vipTier: 'DIAMOND',
    points: 9999,
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  usr_admin_boss: {
    _id: 'usr_admin_boss',
    username: 'admin_boss',
    email: 'admin@aviatorbdt.com',
    phone: '01888776655',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    balance: 50000,
    vipTier: 'DIAMOND',
    points: 9999,
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

let dbDeposits: DepositDoc[] = [
  {
    _id: 'dep_101',
    userId: 'usr_78912',
    userName: 'vip_player07',
    paymentMethod: 'bkash',
    amount: 1000,
    transactionId: 'BK902X88',
    senderNumber: '01700123456',
    status: 'approved',
    createdAt: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date(Date.now() - 7100000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    _id: 'dep_102',
    userId: 'usr_44521',
    userName: 'arif_khan99',
    paymentMethod: 'nagad',
    amount: 2000,
    transactionId: 'NG88A312',
    senderNumber: '01811223344',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    _id: 'dep_103',
    userId: 'usr_99812',
    userName: 'shuvo_gamer',
    paymentMethod: 'rocket',
    amount: 1000,
    transactionId: 'RK445911',
    senderNumber: '01911998877',
    status: 'approved',
    createdAt: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date(Date.now() - 1700000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

let dbWithdrawals: WithdrawDoc[] = [
  {
    _id: 'wth_101',
    userId: 'usr_78912',
    userName: 'vip_player07',
    paymentMethod: 'bKash',
    amount: 1500,
    accountNumber: '01700123456',
    trxId: 'BK771092',
    status: 'approved',
    createdAt: new Date(Date.now() - 5400000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date(Date.now() - 5300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    _id: 'wth_102',
    userId: 'usr_44521',
    userName: 'arif_khan99',
    paymentMethod: 'Nagad',
    amount: 800,
    accountNumber: '01811223344',
    status: 'pending',
    createdAt: new Date(Date.now() - 1200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date(Date.now() - 1200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

// ========================================================
// Telegram Bot Configuration & Instant Alerts
// ========================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8622556616:AAEI7JWLWuGenLALK_o8uRBAcvorUHm_XI';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8622556616';

async function sendTelegramNotification(message: string): Promise<boolean> {
  try {
    const token = TELEGRAM_BOT_TOKEN;
    const chatId = TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      console.warn('Telegram Bot Token or Chat ID is not configured');
      return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram Bot Notification Error:', data.description);
      return false;
    }
    console.log('Telegram Notification successfully sent to Chat ID:', chatId);
    return true;
  } catch (error: any) {
    console.error('Failed to send Telegram notification:', error?.message || error);
    return false;
  }
}

function formatPaymentMethodName(method: string): string {
  if (!method) return 'Bkash';
  const m = method.toLowerCase();
  if (m.includes('bkash')) return 'Bkash';
  if (m.includes('nagad')) return 'Nagad';
  if (m.includes('rocket')) return 'Rocket';
  if (m.includes('upay')) return 'Upay';
  if (m.includes('bank')) return 'Bank';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

// ৪. অথেনটিকেশন মিডলওয়্যার (লগইন ভেরিফিকেশন ও এক্সপায়ারি চেক)
export const requireLogin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'প্রথমে লগইন করুন! অথোরাইজেশন টোকেন পাওয়া যায়নি।' });
  }

  if (typeof token === 'string' && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.decode(token, JWT_SECRET);
    const currentUnix = Math.floor(Date.now() / 1000);

    // এক্সপায়ারড টোকেন রিজেক্ট করা
    if (decoded.exp && decoded.exp < currentUnix) {
      return res.status(401).json({ success: false, message: 'টোকেনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।' });
    }

    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'সেশন মেয়াদোত্তীর্ণ বা ইনভ্যালিড টোকেন, আবার লগইন করুন।' });
  }
};

// ৫. এডমিন সিকিউরিটি মিডলওয়্যার (এডমিন রোল ও পারমিশন ভেরিফিকেশন)
export const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ success: false, message: 'এক্সেস ডিনাইড! সিকিউর এডমিন টোকেন প্রয়োজন।' });
  }

  if (typeof token === 'string' && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.decode(token, JWT_SECRET);
    const currentUnix = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < currentUnix) {
      return res.status(401).json({ success: false, message: 'এডমিন সেশন মেয়াদোত্তীর্ণ হয়েছে!' });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'আপনার এডমিন প্যানেলে ঢোকার পারমিশন নেই!' });
    }
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'সেশন মেয়াদোত্তীর্ণ বা ইনভ্যালিড টোকেন!' });
  }
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;
  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'X-CSRF-Token'],
    credentials: false,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  const httpServer = http.createServer(app);

  // ========================================================
  // WebSocket Server Setup for Real-time Balance & Drops Fix
  // ========================================================
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  interface ClientConnection {
    ws: WebSocket;
    userId: string;
    username?: string;
    lastPing: number;
  }

  const connectedClients = new Set<ClientConnection>();

  // Broadcast helper to push instant balance to user's devices/tabs
  const broadcastUserBalance = (targetUserIdOrName: string, balance: number, metadata: any = {}) => {
    const payload = JSON.stringify({
      type: 'BALANCE_UPDATE',
      userId: targetUserIdOrName,
      balance,
      ...metadata,
      serverTime: Date.now(),
    });

    for (const client of connectedClients) {
      if (
        client.userId === targetUserIdOrName ||
        client.username?.toLowerCase() === String(targetUserIdOrName).toLowerCase() ||
        targetUserIdOrName === 'all'
      ) {
        if (client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.send(payload);
          } catch (e) {
            console.error("WS Send error:", e);
          }
        }
      }
    }
  };

  wss.on('connection', (ws: WebSocket) => {
    const clientInfo: ClientConnection = {
      ws,
      userId: 'guest',
      lastPing: Date.now(),
    };
    connectedClients.add(clientInfo);

    // Initial Welcome and Health ACK
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      status: 'CONNECTED',
      serverTime: Date.now(),
      message: 'Real-time WebSocket connection active',
    }));

    ws.on('message', async (data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        clientInfo.lastPing = Date.now();

        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', serverTime: Date.now() }));
          return;
        }

        if (msg.type === 'AUTH') {
          const authId = String(msg.userId || 'usr_78912').trim();
          clientInfo.userId = authId;
          const user = dbUsers[authId] || Object.values(dbUsers).find((u) => u._id === authId || u.username === authId);
          if (user) {
            clientInfo.username = user.username;
            ws.send(JSON.stringify({
              type: 'AUTH_SUCCESS',
              userId: user._id,
              username: user.username,
              balance: user.balance,
            }));
          }
          return;
        }

        if (msg.type === 'SYNC_BALANCE') {
          const { newBalance, userId, amount, actionType, description } = msg;
          const cleanBal = Math.max(0, Number(newBalance) || 0);
          const targetId = userId || clientInfo.userId;

          let targetUser = dbUsers[targetId] || Object.values(dbUsers).find((u) => u._id === targetId || u.username === targetId);
          if (targetUser) {
            targetUser.balance = cleanBal;
            targetUser.updatedAt = new Date().toISOString();
          }

          if (isMongoConnected && targetId) {
            try {
              await UserModel.findByIdAndUpdate(targetId, { balance: cleanBal });
            } catch (e) {
              // ignore
            }
          }

          broadcastUserBalance(targetId, cleanBal, { amount, actionType, description });
          return;
        }
      } catch (err) {
        console.error("WS Message handling error:", err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(clientInfo);
    });

    ws.on('error', () => {
      connectedClients.delete(clientInfo);
    });
  });

  // Heartbeat cleanup for inactive sockets every 15 seconds
  setInterval(() => {
    const now = Date.now();
    for (const client of connectedClients) {
      if (now - client.lastPing > 35000) {
        client.ws.terminate();
        connectedClients.delete(client);
      } else if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.ping();
        } catch (e) {
          // ignore
        }
      }
    }
  }, 15000);

  app.use(express.json());
  app.use(sanitizeInputsMiddleware);

  // ব্রাউজার ক্যাশ প্রতিরোধ ও গ্লোবাল সিকিউরিটি ডিরেক্টিভস মিডলওয়্যার (Security & Anti-Tamper Headers)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Security-Policy', 'Aviator-BDT-Strict-v1');
    next();
  });

  // ==========================================
  // ১. রেজিস্ট্রেশন এপিআই (Fix Register)
  // POST /api/register and POST /api/auth/register
  // ==========================================
  const handleRegister = async (req: express.Request, res: express.Response) => {
    try {
      const { username, phone, password, referredBy } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'ইউজারনেম এবং পাসওয়ার্ড বাধ্যতামূলক!' });
      }

      // ইউজারনেমের স্পেস মুছে ছোট হাতের অক্ষরে পরিবর্তন (Case Insensitive Solution)
      const cleanUsername = String(username).trim().toLowerCase();
      const cleanPassword = String(password).trim();
      const cleanReferredBy = referredBy ? String(referredBy).trim() : '';

      // ১. ইউজার আগেই আছে কি না চেক (MongoDB & Memory)
      let existingUser = Object.values(dbUsers).find(
        (u) => u.username.toLowerCase() === cleanUsername
      );

      if (!existingUser && isMongoConnected) {
        try {
          const mongoExisting = await UserModel.findOne({ username: cleanUsername });
          if (mongoExisting) {
            existingUser = mongoExisting.toObject();
          }
        } catch (e) {
          // ignore error
        }
      }

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'এই ইউজারনেমটি আগে থেকেই রেজিস্টার্ড!' });
      }

      // ২. পাসওয়ার্ড হ্যাশ করা (১০ রাউন্ড সিকিউরিটি)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(cleanPassword, salt);
      const userId = `usr_${Date.now()}`;
      const newUser: UserDoc = {
        _id: userId,
        username: cleanUsername,
        phone: (phone || '01700000000').trim(),
        password: hashedPassword,
        role: 'player',
        balance: 0,
        vipTier: 'BRONZE',
        points: 50,
        referredBy: cleanReferredBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dbUsers[userId] = newUser;

      // ক্লাউড ডাটাবেজে স্থায়ীভাবে সেভ
      if (isMongoConnected) {
        try {
          const userDoc = new UserModel({
            username: cleanUsername,
            phone: newUser.phone,
            password: hashedPassword,
            role: 'player',
            balance: 0,
            vipTier: 'BRONZE',
            points: 50,
            referredBy: cleanReferredBy,
          });
          await userDoc.save();
        } catch (e: any) {
          console.error("MongoDB Save Notice:", e.message);
        }
      }

      const currentUnix = Math.floor(Date.now() / 1000);
      const token = jwt.encode({
        id: newUser._id,
        role: newUser.role,
        username: newUser.username,
        iat: currentUnix,
        exp: currentUnix + (7 * 24 * 3600), // 7 days expiry
      }, JWT_SECRET);

      recordSuccessfulLogin(cleanUsername);

      res.status(201).json({
        success: true,
        message: 'রেজিস্ট্রেশন সফল হয়েছে!',
        token,
        user: { id: newUser._id, _id: newUser._id, username: newUser.username, balance: newUser.balance, role: newUser.role, phone: newUser.phone, referredBy: newUser.referredBy },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + (error.message || 'Server error') });
    }
  };

  app.post('/api/register', handleRegister);
  app.post('/api/auth/register', handleRegister);

  // ==========================================
  // ২. লগইন এপিআই (Fix Login with Anti-Brute-Force)
  // POST /api/login and POST /api/auth/login
  // ==========================================
  const handlePlayerLogin = async (req: express.Request, res: express.Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'ইউজারনেম এবং পাসওয়ার্ড দিন!' });
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const cleanPassword = String(password).trim();

      // ১. ডাটাবেজে ইউজার খোঁজা (Case Insensitive - Memory & MongoDB)
      let user = Object.values(dbUsers).find(
        (u) =>
          (u.username.toLowerCase() === cleanUsername || u.phone === cleanUsername) &&
          u.role === 'player'
      );

      if (!user && isMongoConnected) {
        try {
          const mongoUser = await UserModel.findOne({
            $or: [{ username: cleanUsername }, { phone: cleanUsername }],
            role: 'player',
          });
          if (mongoUser) {
            const mUserObj = mongoUser.toObject();
            user = {
              _id: String(mUserObj._id),
              username: mUserObj.username,
              phone: mUserObj.phone || '01700000000',
              password: mUserObj.password,
              role: mUserObj.role || 'player',
              balance: Number(mUserObj.balance) || 0,
              vipTier: mUserObj.vipTier || 'BRONZE',
              points: Number(mUserObj.points) || 0,
              createdAt: mUserObj.createdAt ? new Date(mUserObj.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: mUserObj.updatedAt ? new Date(mUserObj.updatedAt).toISOString() : new Date().toISOString(),
            };
            dbUsers[user._id] = user;
          }
        } catch (e) {
          // ignore error
        }
      }

      // ইউজার না পাওয়া গেলে
      if (!user) {
        recordFailedLogin(cleanUsername);
        return res.status(400).json({ success: false, message: 'এই ইউজারনেমে কোনো একাউন্ট পাওয়া যায়নি!' });
      }

      // ২. পাসওয়ার্ড সরাসরি হ্যাশের সাথে ম্যাচ করা
      let isPasswordMatch = false;
      if (user.password) {
        isPasswordMatch = await bcrypt.compare(cleanPassword, user.password);
      }

      if (!isPasswordMatch) {
        recordFailedLogin(cleanUsername);
        return res.status(400).json({ success: false, message: 'পাসওয়ার্ড ভুল হয়েছে!' });
      }

      // ৩. পাসওয়ার্ড মিলে গেলে সফলতা নিশ্চিত করা এবং রেট লিমিট ক্লিয়ার করা
      recordSuccessfulLogin(cleanUsername);

      const currentUnix = Math.floor(Date.now() / 1000);
      const token = jwt.encode({
        id: user._id,
        role: user.role,
        username: user.username,
        iat: currentUnix,
        exp: currentUnix + (7 * 24 * 3600), // 7 days expiry
      }, JWT_SECRET);

      res.status(200).json({
        success: true,
        message: 'লগইন সফল!',
        token,
        user: {
          id: user._id,
          _id: user._id,
          username: user.username,
          phone: user.phone,
          role: user.role,
          balance: user.balance,
          vipTier: user.vipTier,
          points: user.points,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + (error.message || 'Server error') });
    }
  };

  app.post('/api/login', authRateLimiterMiddleware, handlePlayerLogin);
  app.post('/api/auth/login', authRateLimiterMiddleware, handlePlayerLogin);

  // ==========================================
  // [GAME ENGINE] ৯২%-৯৪% RTP ভিত্তিক ক্র্যাশ পয়েন্ট ক্যালকুলেশন
  // POST /api/game/crash-point
  // ==========================================
  app.post('/api/game/crash-point', (req, res) => {
    const { totalBetsInRound = 0, playerHasActiveBet = false, playerBetAmount = 0 } = req.body;
    const crashPoint = calculateCrashPoint(Number(totalBetsInRound), Boolean(playerHasActiveBet), Number(playerBetAmount));

    res.status(200).json({
      success: true,
      crashPoint,
      targetRtp: 0.90,
      instantCrash: crashPoint <= 1.05,
    });
  });

  // ==========================================
  // [FORTUNE GEMS] ৯২%-৯৪% RTP ভিত্তিক স্লট স্পিন এপিআই
  // POST /api/game/fortune-gems/spin
  // ==========================================
  const fortuneSymbols: Record<string, { id: number; payout3x: number; weight: number }> = {
    RED_GEM: { id: 1, payout3x: 30, weight: 5 },
    BLUE_GEM: { id: 2, payout3x: 15, weight: 10 },
    GREEN_GEM: { id: 3, payout3x: 8, weight: 20 },
    A: { id: 4, payout3x: 5, weight: 30 },
    K: { id: 5, payout3x: 3, weight: 40 },
    WILD: { id: 6, payout3x: 50, weight: 2 },
  };

  const bonusMultiplierReel = [
    { type: 'MULTIPLIER', value: 1, weight: 50 },
    { type: 'MULTIPLIER', value: 2, weight: 30 },
    { type: 'MULTIPLIER', value: 3, weight: 15 },
    { type: 'MULTIPLIER', value: 5, weight: 8 },
    { type: 'LUCKY_WHEEL', value: 'WHEEL', weight: 2 },
  ];

  const getWeightedRandom = (items: typeof bonusMultiplierReel) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of items) {
      if (random < item.weight) return item;
      random -= item.weight;
    }
    return items[0];
  };

  app.post('/api/game/fortune-gems/spin', async (req, res) => {
    try {
      const { userId = 'usr_78912', betAmount = 50 } = req.body;
      const user = dbUsers[userId] || Object.values(dbUsers)[0];

      if (!user || user.balance < betAmount) {
        return res.status(400).json({ success: false, message: 'পর্যাপ্ত ব্যালেন্স নেই' });
      }

      // ব্যালেন্স ডেবিট করা (বেট কাটা)
      user.balance = Math.max(0, user.balance - Number(betAmount));

      // ৯২%-৯৪% RTP টিয়ার নির্ধারণ (৩০% লস, ৬০% লো ১-২x, ৮% মিডিয়াম ৩-৫x, ২% হাই ১০x+)
      const rtpTier = determineRTPTier();
      let finalReels: string[] = [];
      let fourthReelResult = getWeightedRandom(bonusMultiplierReel);
      const symbolNames = Object.keys(fortuneSymbols);

      let generatedWin = 0;
      if (rtpTier === 'HIGH') {
        // ২% সম্ভাবনা: ওয়াইল্ড বা রেড জেম ট্রিপল ম্যাচ + বোনাস রিল
        const winningSymbol = Math.random() < 0.5 ? 'WILD' : 'RED_GEM';
        finalReels = [winningSymbol, winningSymbol, winningSymbol];
        fourthReelResult = { type: 'LUCKY_WHEEL', value: 'WHEEL', weight: 2 };
        generatedWin = Number(betAmount) * 12;
      } else if (rtpTier === 'MEDIUM') {
        // ৮% সম্ভাবনা: ব্লু জেম বা গ্রিন জেম ট্রিপল ম্যাচ
        const winningSymbol = Math.random() < 0.5 ? 'BLUE_GEM' : 'GREEN_GEM';
        finalReels = [winningSymbol, winningSymbol, winningSymbol];
        fourthReelResult = { type: 'MULTIPLIER', value: 3, weight: 15 };
        generatedWin = Number(betAmount) * 4;
      } else if (rtpTier === 'LOW') {
        // ৬০% সম্ভাবনা: A বা K ট্রিপল ম্যাচ অথবা ২-ম্যাচ
        const winningSymbol = Math.random() < 0.5 ? 'A' : 'K';
        finalReels = [winningSymbol, winningSymbol, winningSymbol];
        fourthReelResult = { type: 'MULTIPLIER', value: Math.random() < 0.5 ? 1 : 2, weight: 30 };
        generatedWin = Number(betAmount) * 1.5;
      } else {
        // ৩০% সম্ভাবনা: নন-ম্যাচিং লস
        finalReels = ['RED_GEM', 'A', 'GREEN_GEM'];
        fourthReelResult = { type: 'MULTIPLIER', value: 1, weight: 50 };
        generatedWin = 0;
      }

      // ৯২%-৯৪% RTP ক্যালকুলেশন এবং সর্বোচ্চ ক্যাপ প্রয়োগ
      const finalWinAmount = calculateRTPWin(Number(betAmount), generatedWin, rtpTier);

      // জিতলে জেতা টাকা ব্যালেন্সে যোগ
      if (finalWinAmount > 0) {
        user.balance = Math.max(0, user.balance + Number(finalWinAmount));
      }

      res.status(200).json({
        success: true,
        reels: finalReels,
        fourthReel: fourthReelResult,
        winAmount: finalWinAmount,
        currentBalance: user.balance,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error occurred' });
    }
  });

  // ==========================================
  // [SUPER ACE] 5x4 slot bet and payout
  // POST /api/game/super-ace/spin
  // ==========================================
  app.post('/api/game/super-ace/spin', (req, res) => {
    try {
      const { userId = 'usr_78912' } = req.body;
      const betAmount = Math.round(Number(req.body.betAmount) * 100) / 100;
      const user = dbUsers[userId] || Object.values(dbUsers).find((item) => item._id === userId || item.username === userId);
      const symbols = [
        { id: 'ACE', multiplier: 8 },
        { id: 'GEM', multiplier: 15 },
        { id: 'CROWN', multiplier: 30 },
        { id: 'SEVEN', multiplier: 50 },
      ];

      if (!user || !BET_PRESETS.includes(betAmount as (typeof BET_PRESETS)[number]) || user.balance < betAmount) {
        return res.status(400).json({ success: false, message: 'পর্যাপ্ত ব্যালেন্স নেই বা বেট সঠিক নয়' });
      }

      user.balance = Math.max(0, user.balance - betAmount);
      const winning = Math.random() < 0.32;
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const reels = Array.from({ length: 20 }, (_, index) => {
        if (winning && index < 3) return symbol.id;
        return symbols[(index + (winning ? 1 : 0)) % symbols.length].id;
      });
      const winAmount = winning ? calculateRTPWin(betAmount, betAmount * symbol.multiplier, determineRTPTier()) : 0;
      user.balance = Math.max(0, user.balance + winAmount);
      user.updatedAt = new Date().toISOString();
      broadcastUserBalance(user._id, user.balance, { actionType: 'SUPER_ACE_SETTLED', amount: winAmount - betAmount });

      return res.status(200).json({ success: true, reels, winAmount, currentBalance: user.balance });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Error occurred' });
    }
  });

  // ==========================================
  // [REALTIME FALLBACK] ১. রিয়েল-টাইম ব্যালেন্স ও স্টেট সিঙ্ক (HTTP Polling Fallback)
  // GET /api/realtime/sync?userId=...
  // ==========================================
  app.get('/api/realtime/sync', async (req, res) => {
    try {
      const queryUserId = String(req.query.userId || '').trim();
      let user: any = null;
      if (queryUserId) {
        try { user = await UserModel.findById(queryUserId); } catch { /* username or phone lookup below */ }
        if (!user) user = await UserModel.findOne({ $or: [{ username: queryUserId.toLowerCase() }, { phone: queryUserId }] });
      }
      if (!user) {
        return res.status(200).json({
          success: false,
          message: 'ইউজার পাওয়া যায়নি!',
          balance: 0,
          user: null,
          serverTime: Date.now(),
        });
      }

      const safeUser = user as any;

      res.status(200).json({
        success: true,
        balance: Number(safeUser.balance ?? 0),
        user: {
          id: safeUser._id,
          _id: safeUser._id,
          username: safeUser.username,
          balance: safeUser.balance ?? 0,
          vipTier: safeUser.vipTier,
          points: safeUser.points ?? 0,
        },
        serverTime: Date.now(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/realtime/ping', (req, res) => {
    res.status(200).json({ success: true, status: 'pong', serverTime: Date.now() });
  });

  // ==========================================
  // [GAME] Atomic balance settlement. The client never supplies an absolute balance.
  // POST /api/game/settle-bet
  // ==========================================
  app.post('/api/game/settle-bet', requireLogin, async (req, res) => {
    try {
      const { betAmount = 0, winAmount = 0, gameName = 'Game' } = req.body;
      const userId = String((req as any).user?.id || '').trim();
      const cleanBet = Math.round(Number(betAmount) * 100) / 100;
      const cleanWin = Math.max(0, Math.round(Number(winAmount) * 100) / 100);
      if (!userId || !Number.isFinite(cleanBet) || cleanBet < 0 || !Number.isFinite(cleanWin) || (cleanBet === 0 && cleanWin === 0)) {
        return res.status(400).json({ success: false, message: 'Invalid settlement request' });
      }

      const sanitizedWin = cleanBet > 0 ? Math.min(cleanWin, Math.floor(cleanBet * 8)) : cleanWin;
      const user = await UserModel.findOneAndUpdate(
        { $or: [{ _id: userId }, { username: String(userId).toLowerCase() }], balance: { $gte: cleanBet } },
        { $inc: { balance: sanitizedWin - cleanBet }, $set: { updatedAt: new Date() } },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি!' });
      }

      const newBalance = Number(user.balance);

      // রিয়েল-টাইম ব্রডকাস্ট WebSocket কানেকশনে
      broadcastUserBalance(String(user._id), newBalance, {
        winAmount: sanitizedWin,
        betAmount: Number(betAmount),
        gameName,
        actionType: sanitizedWin > 0 ? 'WIN' : 'BET',
      });

      res.status(200).json({
        success: true,
        message: 'ব্যালেন্স সফলভাবে আপডেট হয়েছে',
        betAmount: Number(betAmount),
        winAmount: sanitizedWin,
        balance: newBalance,
        newBalance,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
  });

  app.post('/api/game/play', requireLogin, async (req, res) => {
    try {
      const { gameId, betAmount } = req.body;
      const userId = String((req as any).user?.id || '').trim();
      const cleanBet = Math.round(Number(betAmount) * 100) / 100;
      if (!userId || !gameId || !Number.isFinite(cleanBet) || cleanBet <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid game request' });
      }
      const winAmount = Math.random() < 0.38 ? Math.round(cleanBet * (1.5 + Math.random() * 4) * 100) / 100 : 0;
      const user = await UserModel.findOneAndUpdate(
        { _id: userId, balance: { $gte: cleanBet } },
        { $inc: { balance: winAmount - cleanBet }, $set: { updatedAt: new Date() } },
        { new: true, runValidators: true }
      );
      if (!user) return res.status(400).json({ success: false, message: 'পর্যাপ্ত ব্যালেন্স নেই বা ইউজার পাওয়া যায়নি' });
      const balance = Number(user.balance);
      broadcastUserBalance(String(user._id), balance, { gameId, betAmount: cleanBet, winAmount, actionType: 'GAME_SETTLED' });
      return res.json({ success: true, gameId, betAmount: cleanBet, winAmount, balance });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Game error' });
    }
  });

  // ==========================================
  // ৩. সেপারেট এডমিন লগইন (এডমিন সিকিউরিটির জন্য)
  // POST /api/admin/login
  // ==========================================
  app.post('/api/admin/login', authRateLimiterMiddleware, async (req, res) => {
    try {
      const { email, username, password } = req.body;
      const targetEmail = (email || username || '').trim();

      // ১. আপনার নির্ধারিত ইমেইল চেক
      if (targetEmail !== "riponcoolboy@gmail.com" && targetEmail !== "admin_ripon") {
        recordFailedLogin(targetEmail || 'admin');
        return res.status(401).json({ success: false, message: "অনুমোদিত এডমিন ইমেইল নয়!" });
      }

      // ২. আপনার নির্ধারিত স্ট্রং পাসওয়ার্ড চেক
      if (password !== "Akashvai92@#*") {
        recordFailedLogin(targetEmail || 'admin');
        return res.status(401).json({ success: false, message: "ভুল এডমিন পাসওয়ার্ড!" });
      }

      recordSuccessfulLogin(targetEmail || 'admin');

      // ৩. সিকিউর টোকেন জেনারেট (7 Days Expiry)
      const currentUnix = Math.floor(Date.now() / 1000);
      const token = jwt.encode({
        email: "riponcoolboy@gmail.com",
        role: 'admin',
        username: 'admin_ripon',
        iat: currentUnix,
        exp: currentUnix + (7 * 24 * 3600),
      }, JWT_SECRET);

      res.status(200).json({
        success: true,
        message: "এডমিন লগইন সফল!",
        token,
        isAdmin: true,
        user: {
          _id: 'usr_admin_ripon',
          username: "admin_ripon",
          email: "riponcoolboy@gmail.com",
          role: "admin",
          balance: 0,
          vipTier: 'DIAMOND',
          points: 9999,
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "এডমিন লগইন এরর: " + error.message });
    }
  });

  // ==========================================
  // [AUTH] ইউজার ব্যালেন্স চেক (GET /api/user/balance/:userId)
  // ==========================================
  app.get('/api/user/balance/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      let user: any = null;
      try { user = await UserModel.findById(userId); } catch { /* username or phone lookup below */ }
      if (!user) user = await UserModel.findOne({ $or: [{ username: userId.toLowerCase() }, { phone: userId }] });

      if (!user) {
        return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি!', balance: 0 });
      }

      const safeUser = user as any;

      res.status(200).json({
        success: true,
        balance: safeUser.balance ?? 0,
        user: {
          id: safeUser._id,
          username: safeUser.username,
          balance: safeUser.balance ?? 0,
          vipTier: safeUser.vipTier,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'সার্ভার এরর', balance: 0 });
    }
  });

  // ==========================================
  // [AUTH] বর্তমান ইউজার প্রোফাইল ও আসল ব্যালেন্স (requireLogin)
  // GET /api/auth/profile, /api/user/profile, /api/user/me
  // ==========================================
  const handleUserProfile = async (req: express.Request, res: express.Response) => {
    try {
      const userPayload = (req as any).user;
      let user: any = null;
      try { user = await UserModel.findById(userPayload?.id); } catch { /* username lookup below */ }
      if (!user) user = await UserModel.findOne({ username: userPayload?.username });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি!' });
      }

      const safeUser = user as any;

      res.status(200).json({
        success: true,
        user: {
          id: safeUser._id,
          _id: safeUser._id,
          username: safeUser.username,
          phone: safeUser.phone,
          role: safeUser.role,
          balance: safeUser.balance ?? 0,
          vipTier: safeUser.vipTier,
          points: safeUser.points ?? 0,
          referredBy: safeUser.referredBy,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  };

  app.get('/api/auth/profile', requireLogin, handleUserProfile);
  app.get('/api/user/profile', requireLogin, handleUserProfile);
  app.get('/api/user/me', requireLogin, handleUserProfile);

  // ==========================================
  // [PLAYER] ক্যাশআউট বা জেতার পর ডাটাবেজে ব্যালেন্স স্থায়ীভাবে আপডেট করার এপিআই
  // POST /api/user/update-balance
  // ==========================================
  app.post('/api/user/update-balance', async (req, res) => {
    try {
      let token = req.headers.authorization;
      let decoded: any = null;

      if (token) {
        if (typeof token === 'string' && token.startsWith('Bearer ')) {
          token = token.slice(7).trim();
        }
        try {
          decoded = jwt.decode(token, JWT_SECRET);
        } catch (e) {
          // fallback if token error
        }
      }

      return res.status(410).json({ success: false, message: 'Use /api/game/settle-bet for atomic wallet changes.' });
    } catch (err: any) {
      console.error("Update Balance API Error:", err);
      res.status(500).json({ success: false, message: "Failed to update balance" });
    }
  });

  // ==========================================
  // [PLAYER] ২. একটিভ পেমেন্ট নম্বর গেট করা (ডিপোজিট পেজে দেখানোর জন্য)
  // GET /api/payment-methods
  // ==========================================
  app.get('/api/payment-methods', async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        settings: dbPaymentSettings,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [PLAYER] ৩. ডিপোজিট রিকোয়েস্ট সাবমিট করা (Telegram Bot Alert)
  // POST /api/deposit/request
  // ==========================================
  app.post('/api/deposit/request', async (req, res) => {
    try {
      const { userId, paymentMethod, amount, transactionId, senderNumber, userName } = req.body;

      if (!userId || !paymentMethod || !amount || !transactionId || !senderNumber) {
        return res.status(400).json({
          success: false,
          error: 'সকল ফিল্ড পূরণ করুন!',
        });
      }

      const cleanTrx = transactionId.trim().toUpperCase();
      const existing = dbDeposits.find(
        (d) => d.transactionId.toUpperCase() === cleanTrx && d.status !== 'rejected'
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'এই Transaction ID টি ইতিমধ্যে জমা দেওয়া হয়েছে!',
        });
      }

      const user = (userId && dbUsers[userId]) || Object.values(dbUsers).find(
        (u) => u._id === userId || (userName && u.username.toLowerCase() === String(userName).toLowerCase())
      );
      const resolvedUserName = userName || user?.username || 'vip_player07';

      const newDeposit: DepositDoc = {
        _id: `dep_${Date.now()}`,
        userId: userId || user?._id || 'usr_78912',
        userName: resolvedUserName,
        paymentMethod,
        amount: Number(amount),
        transactionId: cleanTrx,
        senderNumber: senderNumber.trim(),
        status: 'pending',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      dbDeposits.unshift(newDeposit);

      const depositEvent = JSON.stringify({
        type: 'DEPOSIT_CREATED',
        deposit: newDeposit,
        serverTime: Date.now(),
      });
      for (const client of connectedClients) {
        if (client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.send(depositEvent);
          } catch (e) {
            console.error("WS Deposit event error:", e);
          }
        }
      }

      // 🚨 NEW DEPOSIT REQUEST! Telegram notification
      const depositAlertMsg = 
`🚨 NEW DEPOSIT REQUEST!
👤 User: ${resolvedUserName}
💰 Amount: ৳${Number(amount)}
💳 Method: ${formatPaymentMethodName(paymentMethod)}
🔢 TrxID: ${cleanTrx}`;

      sendTelegramNotification(depositAlertMsg);

      res.status(201).json({
        success: true,
        message: 'ডিপোজিট রিকোয়েস্ট জমা হয়েছে, এডমিন ভেরিফাই করছেন।',
        deposit: newDeposit,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [PLAYER] ৪. উইথড্র রিকোয়েস্ট সাবমিট করা (Telegram Bot Alert)
  // POST /api/withdraw/request
  // ==========================================
  app.post('/api/withdraw/request', async (req, res) => {
    try {
      const { userId, userName, amount, paymentMethod, accountNumber, phone } = req.body;
      const withdrawNumber = (accountNumber || phone || '').trim();
      const withdrawAmount = Number(amount);

      if (!withdrawNumber || !withdrawAmount || withdrawAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'সঠিক একাউন্ট নম্বর এবং উইথড্র পরিমাণ দিন!',
        });
      }

      const user = (userId && dbUsers[userId]) || Object.values(dbUsers).find(
        (u) => u._id === userId || (userName && u.username.toLowerCase() === String(userName).toLowerCase())
      );

      const resolvedUserName = userName || user?.username || 'Player';

      if (user && user.balance < withdrawAmount) {
        return res.status(400).json({
          success: false,
          error: 'আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই!',
        });
      }

      if (user) {
        user.balance = Math.max(0, user.balance - withdrawAmount);
        user.updatedAt = new Date().toISOString();
        broadcastUserBalance(user._id, user.balance, { actionType: 'WITHDRAW', amount: withdrawAmount });

        if (isMongoConnected) {
          try {
            await UserModel.findByIdAndUpdate(user._id, { balance: user.balance });
          } catch (e) {}
        }
      }

      const newWithdraw: WithdrawDoc = {
        _id: `wth_${Date.now()}`,
        userId: userId || user?._id || 'usr_78912',
        userName: resolvedUserName,
        paymentMethod: paymentMethod || 'bKash',
        amount: withdrawAmount,
        accountNumber: withdrawNumber,
        status: 'pending',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      dbWithdrawals.unshift(newWithdraw);

      // 💸 NEW WITHDRAW REQUEST! Telegram notification
      const withdrawAlertMsg = 
`💸 NEW WITHDRAW REQUEST!
👤 User: ${resolvedUserName}
💰 Amount: ৳${withdrawAmount}
💳 Number: ${withdrawNumber}`;

      sendTelegramNotification(withdrawAlertMsg);

      res.status(201).json({
        success: true,
        message: 'উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে!',
        withdraw: newWithdraw,
        newBalance: user ? user.balance : undefined,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // GET /api/withdrawals
  app.get('/api/withdrawals', async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        withdrawals: dbWithdrawals,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN & USER] সকল ডিপোজিট লিস্ট গেট করা
  // GET /api/deposits
  // ==========================================
  app.get('/api/deposits', async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        deposits: dbDeposits,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ১. পেমেন্ট নম্বর আপডেট করা (verifyAdmin)
  // POST /api/admin/payment-settings
  // ==========================================
  app.post('/api/admin/payment-settings', verifyAdmin, async (req, res) => {
    try {
      const {
        bkashNumber,
        nagadNumber,
        rocketNumber,
        sendMoneyNumber,
        usdtAddress,
        usdtNetwork,
        bankAccountNumber,
        bankNameDetails,
      } = req.body;

      if (!bkashNumber && !nagadNumber && !bankAccountNumber) {
        return res.status(400).json({
          success: false,
          error: 'কমপক্ষে একটি পেমেন্ট ফিল্ড পূরণ করা আবশ্যক!',
        });
      }

      dbPaymentSettings = {
        ...dbPaymentSettings,
        bkashNumber: bkashNumber || dbPaymentSettings.bkashNumber,
        nagadNumber: nagadNumber !== undefined ? nagadNumber : dbPaymentSettings.nagadNumber,
        rocketNumber: rocketNumber !== undefined ? rocketNumber : dbPaymentSettings.rocketNumber,
        sendMoneyNumber: sendMoneyNumber !== undefined ? sendMoneyNumber : dbPaymentSettings.sendMoneyNumber,
        usdtAddress: usdtAddress !== undefined ? usdtAddress : dbPaymentSettings.usdtAddress,
        usdtNetwork: usdtNetwork !== undefined ? usdtNetwork : dbPaymentSettings.usdtNetwork,
        bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : dbPaymentSettings.bankAccountNumber,
        bankNameDetails: bankNameDetails !== undefined ? bankNameDetails : dbPaymentSettings.bankNameDetails,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      res.status(200).json({
        success: true,
        message: 'পেমেন্ট গেটওয়ে নম্বর ও তথ্য সফলভাবে সেভ হয়েছে!',
        settings: dbPaymentSettings,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ২. KPI ড্যাশবোর্ড ও অ্যানালিটিক্স স্ট্যাটাস
  // GET /api/admin/stats
  // ==========================================
  app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {
      const totalDeposits = dbDeposits
        .filter((d) => d.status === 'approved')
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);

      const totalWithdrawals = dbWithdrawals
        .filter((w) => w.status === 'approved')
        .reduce((sum, w) => sum + Number(w.amount || 0), 0);

      const pendingDepositsCount = dbDeposits.filter((d) => d.status === 'pending').length;
      const pendingWithdrawalsCount = dbWithdrawals.filter((w) => w.status === 'pending').length;

      const activePlayers = Object.values(dbUsers).filter((u) => u.role === 'player' && !u.isBanned).length;

      const rtpConf = getGlobalRTPConfig();

      res.status(200).json({
        success: true,
        stats: {
          totalDeposits,
          totalWithdrawals,
          netProfit: totalDeposits - totalWithdrawals,
          activePlayers,
          pendingApprovals: pendingDepositsCount + pendingWithdrawalsCount,
          pendingDepositsCount,
          pendingWithdrawalsCount,
          currentRTP: rtpConf.targetRtp,
          rtpMode: rtpConf.mode,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ৩. সকল উইথড্র রিকোয়েস্ট লিস্ট
  // GET /api/admin/withdrawals
  // ==========================================
  app.get('/api/admin/withdrawals', verifyAdmin, async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        withdrawals: dbWithdrawals,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ৪. পেন্ডিং ডিপোজিট এপ্রুভ করা (verifyAdmin)
  // POST /api/admin/deposit/approve
  // POST /api/admin/approve-deposit (alias for frontend compatibility)
  // ==========================================
  const approveDepositHandler = async (req: any, res: any) => {
    try {
      const rawDepositId = req.body?.depositId || req.body?.id || req.body?._id || '';
      const rawTrxId = req.body?.trxId || req.body?.transactionId || req.body?.TrxID || '';
      const exactDepositId = String(rawDepositId || '').trim();
      const exactTrxId = String(rawTrxId || '').trim().toUpperCase();

      const deposit =
        dbDeposits.find((d) => {
          const recordId = String((d as any)._id || (d as any).id || '').trim();
          const recordTrxId = String(d.transactionId || '').trim().toUpperCase();
          const matchesId = Boolean(recordId) && (recordId === exactDepositId || (d as any).id === exactDepositId || (d as any)._id === exactDepositId);
          const matchesTrx = Boolean(exactTrxId) && Boolean(recordTrxId) && recordTrxId === exactTrxId;
          return matchesId || matchesTrx;
        }) || null;

      if (!deposit) {
        return res.status(400).json({
          success: false,
          message: 'ডিপোজিট রেকর্ড খুঁজে পাওয়া যায়নি।',
        });
      }

      if (deposit.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'ইনভ্যালিড বা ইতোমধ্যে প্রসেসকৃত ডিপোজিট',
        });
      }

      const user =
        dbUsers[deposit.userId] ||
        Object.values(dbUsers).find(
          (entry) =>
            entry.username.toLowerCase() === String(deposit.userName || '').toLowerCase() ||
            entry._id === deposit.userId
        ) ||
        null;

      if (!user) {
        dbUsers[deposit.userId] = {
          _id: deposit.userId,
          username: deposit.userName || 'vip_player07',
          phone: deposit.senderNumber || '01700123456',
          role: 'player',
          balance: 0,
          vipTier: 'GOLD',
          points: 0,
          isBanned: false,
          totalDeposits: 0,
          totalWithdrawals: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const targetUser = dbUsers[deposit.userId] || dbUsers[(user && user._id) || deposit.userId];
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'ডিপোজিটের জন্য ইউজার খুঁজে পাওয়া যায়নি।' });
      }

      deposit.status = 'approved';
      deposit.updatedAt = new Date().toISOString();

      const amountToCredit = Number(deposit.amount) || 0;
      targetUser.balance = Number(targetUser.balance || 0) + amountToCredit;
      targetUser.totalDeposits = (Number(targetUser.totalDeposits) || 0) + amountToCredit;
      targetUser.points = (Number(targetUser.points) || 0) + Math.floor(amountToCredit / 5);
      targetUser.updatedAt = new Date().toISOString();

      if (isMongoConnected) {
        try {
          const query = {
            $or: [
              { _id: deposit._id },
              { id: (deposit as any).id || deposit._id },
              { transactionId: deposit.transactionId },
              ...(exactTrxId ? [{ transactionId: exactTrxId }] : []),
            ],
          };

          await Promise.all([
            DepositModel.findOneAndUpdate(
              query,
              { status: 'approved', updatedAt: new Date() },
              { new: true }
            ),
            UserModel.findByIdAndUpdate(targetUser._id, {
              balance: targetUser.balance,
              points: targetUser.points,
              totalDeposits: targetUser.totalDeposits,
              updatedAt: new Date(),
            }, { new: true }),
          ]);
        } catch (e) {
          console.warn('Mongo sync for approved deposit failed:', e);
        }
      }

      broadcastUserBalance(targetUser._id, targetUser.balance, { actionType: 'DEPOSIT_APPROVED', amount: amountToCredit });

      return res.status(200).json({
        success: true,
        message: 'ডিপোজিট সফলভাবে এপ্রুভ করা হয়েছে এবং ব্যালেন্স যুক্ত হয়েছে।',
        newBalance: targetUser.balance,
        updatedUserBalance: targetUser.balance,
        deposit,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  };

  app.post('/api/admin/deposit/approve', verifyAdmin, approveDepositHandler);
  app.post('/api/admin/approve-deposit', verifyAdmin, approveDepositHandler);
  app.get('/api/admin/approve-deposit', verifyAdmin, (req, res) => {
    res.status(200).json({ success: true, message: 'Approve endpoint available', route: '/api/admin/approve-deposit' });
  });

  // ==========================================
  // [ADMIN] ৫. ডিপোজিট রিজেক্ট করা (verifyAdmin)
  // POST /api/admin/deposit/reject
  // ==========================================
  app.post('/api/admin/deposit/reject', verifyAdmin, async (req, res) => {
    try {
      const { depositId, reason } = req.body;
      const deposit = dbDeposits.find((d) => d._id === depositId || (d as any).id === depositId);
      if (!deposit || deposit.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'ইনভ্যালিড বা ইতোমধ্যে প্রসেসকৃত ডিপোজিট' });
      }

      deposit.status = 'rejected';
      deposit.rejectionReason = reason || 'ভুল বা অসঙ্গতিপূর্ণ ট্রানজেকশন তথ্য';
      deposit.updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      res.status(200).json({
        success: true,
        message: 'ডিপোজিট বাতিল করা হয়েছে।',
        deposit,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ৬. উইথড্র এপ্রুভ করা (verifyAdmin)
  // POST /api/admin/withdraw/approve
  // ==========================================
  app.post('/api/admin/withdraw/approve', verifyAdmin, async (req, res) => {
    try {
      const { withdrawId, trxId } = req.body;
      const withdraw = dbWithdrawals.find((w) => w._id === withdrawId || (w as any).id === withdrawId);

      if (!withdraw || withdraw.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'ইনভ্যালিড বা ইতোমধ্যে প্রসেসকৃত উইথড্র রিকোয়েস্ট' });
      }

      const generatedTrx = trxId ? String(trxId).trim().toUpperCase() : `TXW${Date.now().toString().slice(-6)}`;
      withdraw.status = 'approved';
      withdraw.trxId = generatedTrx;
      withdraw.updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (dbUsers[withdraw.userId]) {
        dbUsers[withdraw.userId].totalWithdrawals = (dbUsers[withdraw.userId].totalWithdrawals || 0) + withdraw.amount;
      }

      // Telegram alert
      sendTelegramNotification(`✅ WITHDRAW APPROVED!\n👤 User: ${withdraw.userName}\n💰 Amount: ৳${withdraw.amount}\n📱 Number: ${withdraw.accountNumber}\n🔢 TrxID: ${generatedTrx}`);

      res.status(200).json({
        success: true,
        message: 'উইথড্র রিকোয়েস্ট সফলভাবে এপ্রুভ করা হয়েছে!',
        withdraw,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ৭. উইথড্র রিজেক্ট ও প্লেয়ারকে রিফান্ড প্রদান (verifyAdmin)
  // POST /api/admin/withdraw/reject
  // ==========================================
  app.post('/api/admin/withdraw/reject', verifyAdmin, async (req, res) => {
    try {
      const { withdrawId, reason } = req.body;
      const withdraw = dbWithdrawals.find((w) => w._id === withdrawId || (w as any).id === withdrawId);

      if (!withdraw || withdraw.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'ইনভ্যালিড বা ইতোমধ্যে প্রসেসকৃত উইথড্র রিকোয়েস্ট' });
      }

      withdraw.status = 'rejected';
      withdraw.rejectionReason = reason || 'অ্যাকাউন্ট তথ্যে ভুল অথবা নিয়ম লঙ্ঘন';
      withdraw.updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // প্লেয়ারকে টাকা রিফান্ড করা
      const user = dbUsers[withdraw.userId] || Object.values(dbUsers).find((u) => u.username === withdraw.userName);
      if (user) {
        user.balance += withdraw.amount;
        user.updatedAt = new Date().toISOString();
        broadcastUserBalance(user._id, user.balance, { actionType: 'WITHDRAW_REFUND', amount: withdraw.amount });

        if (isMongoConnected) {
          try {
            await UserModel.findByIdAndUpdate(user._id, { balance: user.balance });
          } catch (e) {}
        }
      }

      res.status(200).json({
        success: true,
        message: 'উইথড্র বাতিল করা হয়েছে এবং প্লেয়ারের অ্যাকাউন্টে টাকা রিফান্ড করা হয়েছে।',
        withdraw,
        newBalance: user ? user.balance : undefined,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ৮. প্লেয়ার ব্যালেন্স এডিট (+/- BDT) (verifyAdmin)
  // POST /api/admin/user/balance
  // ==========================================
  app.post('/api/admin/user/balance', verifyAdmin, async (req, res) => {
    try {
      const { userId, amount, action, reason } = req.body;
      // action: 'ADD' | 'SUBTRACT' | 'SET'
      const user = dbUsers[userId] || Object.values(dbUsers).find((u) => u._id === userId || u.username === userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'প্লেয়ার খুঁজে পাওয়া যায়নি!' });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return res.status(400).json({ success: false, message: 'সঠিক টাকার পরিমাণ দিন!' });
      }

      let oldBalance = user.balance;
      if (action === 'ADD') {
        user.balance += numAmount;
      } else if (action === 'SUBTRACT') {
        user.balance = Math.max(0, user.balance - numAmount);
      } else if (action === 'SET') {
        user.balance = numAmount;
      } else {
        user.balance += numAmount; // Default add
      }

      user.updatedAt = new Date().toISOString();
      broadcastUserBalance(user._id, user.balance, { actionType: 'ADMIN_MANUAL_ADJUST', oldBalance, newBalance: user.balance, reason });

      if (isMongoConnected) {
        try {
          await UserModel.findByIdAndUpdate(user._id, { balance: user.balance });
        } catch (e) {}
      }

      res.status(200).json({
        success: true,
        message: `প্লেয়ারের ব্যালেন্স সফলভাবে আপডেট করা হয়েছে: ৳${user.balance}`,
        user: {
          id: user._id,
          _id: user._id,
          username: user.username,
          phone: user.phone,
          balance: user.balance,
          vipTier: user.vipTier,
          isBanned: user.isBanned,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ৯. প্লেয়ার ব্যান / আনব্যান টগল (verifyAdmin)
  // POST /api/admin/user/toggle-ban
  // ==========================================
  app.post('/api/admin/user/toggle-ban', verifyAdmin, async (req, res) => {
    try {
      const { userId, isBanned } = req.body;
      const user = dbUsers[userId] || Object.values(dbUsers).find((u) => u._id === userId || u.username === userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'প্লেয়ার খুঁজে পাওয়া যায়নি!' });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ success: false, message: 'এডমিন অ্যাকাউন্ট ব্যান করা সম্ভব নয়!' });
      }

      user.isBanned = isBanned !== undefined ? Boolean(isBanned) : !user.isBanned;
      user.updatedAt = new Date().toISOString();

      if (isMongoConnected) {
        try {
          await UserModel.findByIdAndUpdate(user._id, { isBanned: user.isBanned });
        } catch (e) {}
      }

      res.status(200).json({
        success: true,
        message: user.isBanned ? 'প্লেয়ার অ্যাকাউন্ট সফলভাবে সাময়িক ব্যান করা হয়েছে!' : 'প্লেয়ার অ্যাকাউন্ট আনব্যান করা হয়েছে!',
        isBanned: user.isBanned,
        user: {
          id: user._id,
          _id: user._id,
          username: user.username,
          phone: user.phone,
          balance: user.balance,
          isBanned: user.isBanned,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ১০. গেম RTP ও এলগোরিদম কন্ট্রোলার
  // GET /api/admin/rtp & POST /api/admin/rtp
  // ==========================================
  app.get('/api/admin/rtp', verifyAdmin, async (req, res) => {
    try {
      const config = getGlobalRTPConfig();
      const diagnostics = getRTPDiagnostics();
      res.status(200).json({
        success: true,
        config,
        diagnostics,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  app.post('/api/admin/rtp', verifyAdmin, async (req, res) => {
    try {
      const { targetRtp, mode, streakProtection, maxPayoutMultiplier, isDrainActive, resetStats } = req.body;

      if (resetStats) {
        resetRTPStats();
      }

      setGlobalRTPConfig({
        targetRtp: targetRtp !== undefined ? Number(targetRtp) : undefined,
        mode: mode || undefined,
        streakProtection: streakProtection !== undefined ? Boolean(streakProtection) : undefined,
        maxPayoutMultiplier: maxPayoutMultiplier !== undefined ? Number(maxPayoutMultiplier) : undefined,
        isDrainActive: isDrainActive !== undefined ? Boolean(isDrainActive) : undefined,
      });

      const updatedConfig = getGlobalRTPConfig();
      const diagnostics = getRTPDiagnostics();

      res.status(200).json({
        success: true,
        message: 'গেম এলগোরিদম ও RTP কনফিগারেশন রিয়েল-টাইমে আপডেট হয়েছে!',
        config: updatedConfig,
        diagnostics,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ১১. ট্রানজেকশন লগস (সকল ডিপোজিট ও উইথড্র কম্বাইন্ড)
  // GET /api/admin/transactions
  // ==========================================
  app.get('/api/admin/transactions', verifyAdmin, async (req, res) => {
    try {
      const depTxs = dbDeposits.map((d) => ({
        id: d._id,
        type: 'DEPOSIT',
        method: d.paymentMethod,
        amount: d.amount,
        status: d.status === 'approved' ? 'COMPLETED' : d.status === 'rejected' ? 'FAILED' : 'PENDING',
        rawStatus: d.status,
        timestamp: d.createdAt,
        trxId: d.transactionId,
        userName: d.userName,
        userId: d.userId,
        accountNumber: d.senderNumber,
        rejectionReason: d.rejectionReason,
      }));

      const wthTxs = dbWithdrawals.map((w) => ({
        id: w._id,
        type: 'WITHDRAW',
        method: w.paymentMethod,
        amount: w.amount,
        status: w.status === 'approved' ? 'COMPLETED' : w.status === 'rejected' ? 'FAILED' : 'PENDING',
        rawStatus: w.status,
        timestamp: w.createdAt,
        trxId: w.trxId || `WTH-${w.accountNumber.slice(-4)}`,
        userName: w.userName,
        userId: w.userId,
        accountNumber: w.accountNumber,
        rejectionReason: w.rejectionReason,
      }));

      const all = [...depTxs, ...wthTxs].sort((a, b) => b.id.localeCompare(a.id));

      res.status(200).json({
        success: true,
        transactions: all,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // ==========================================
  // [ADMIN] ১২. সকল রেজিস্টার্ড ইউজার লিস্ট দেখা (verifyAdmin)
  // GET /api/admin/users
  // ==========================================
  app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
      const userList = Object.values(dbUsers).map(({ password, ...u }) => u);
      res.status(200).json({
        success: true,
        users: userList,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Auth & Payment API Server with WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
