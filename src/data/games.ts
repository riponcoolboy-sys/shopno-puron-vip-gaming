import { GameItem } from '../types';

const COVER_IMAGE = 'https://images.unsplash.com/photo-1518544889280-3e0c8e7e2f5a?w=600&auto=format&fit=crop&q=80';

export const GAMES_DATA: GameItem[] = [
  {
    id: 'super-ace-deluxe', title: 'Super Ace Deluxe', titleBn: 'সুপার এস ডিলাক্স', provider: 'SHOPNO PURON',
    category: 'hot', rtp: '93.0%', tag: 'HOT', color: '#0EA5E9', accentColor: '#22D3EE', minBet: 1, maxBet: 3000,
    playersCount: 1760, iconName: 'Crown', coverImage: COVER_IMAGE, description: 'দ্রুত গতির সুপার এস ডিলাক্স স্লট।'
  },
  {
    id: 'bounty-showdown', title: 'Bounty Showdown', titleBn: 'বাউন্টি শোডাউন', provider: 'PRAGMATIC PLAY',
    category: 'hot', rtp: '96.5%', tag: 'HOT', color: '#F97316', accentColor: '#FBBF24', minBet: 1, maxBet: 5000,
    playersCount: 1420, iconName: 'Target', coverImage: COVER_IMAGE, description: 'বাউন্টি এবং বিগ উইনের দ্রুত শোডাউন।'
  },
  {
    id: 'super-elements', title: 'Super Elements', titleBn: 'সুপার এলিমেন্টস', provider: 'JILI',
    category: 'hot', rtp: '96.8%', tag: 'HOT', color: '#8B5CF6', accentColor: '#C084FC', minBet: 1, maxBet: 3000,
    playersCount: 1280, iconName: 'Sparkles', coverImage: COVER_IMAGE, description: 'চার উপাদানের শক্তিতে ভরা অ্যাকশন গেম।'
  },
  {
    id: 'boxing-king', title: 'Boxing King', titleBn: 'বক্সিং কিং', provider: 'JILI',
    category: 'hot', rtp: '97.2%', tag: 'HOT', color: '#DC2626', accentColor: '#EF4444', minBet: 1, maxBet: 3000,
    playersCount: 2640, iconName: 'Gamepad2', coverImage: COVER_IMAGE, description: 'চ্যাম্পিয়ন বেল্ট ও কম্বো মাল্টিপ্লায়ারের ফাইটিং গেম।'
  },
  {
    id: 'fortune-gems-3', title: 'Fortune Gems 3', titleBn: 'ফরচুন জেমস ৩', provider: 'JILI',
    category: 'slots', rtp: '97.2%', tag: 'POPULAR', color: '#D97706', accentColor: '#FBBF24', minBet: 1, maxBet: 3000,
    playersCount: 5490, iconName: 'Gem', coverImage: COVER_IMAGE, description: 'রত্ন, ওয়াইল্ড এবং বোনাস মাল্টিপ্লায়ারের স্লট।'
  },
  {
    id: 'garuda-500', title: 'Garuda 500', titleBn: 'গরুড়া ৫০০', provider: 'JILI',
    category: 'slots', rtp: '96.9%', tag: 'NEW', color: '#F59E0B', accentColor: '#FDE68A', minBet: 1, maxBet: 5000,
    playersCount: 2310, iconName: 'Bird', coverImage: COVER_IMAGE, description: 'গরুড়া থিমের ৫০০x পর্যন্ত পুরস্কারের স্লট।'
  },
  {
    id: 'magic-ace-wild-lock', title: 'Magic Ace Wild Lock', titleBn: 'ম্যাজিক এস ওয়াইল্ড লক', provider: 'PRAGMATIC PLAY',
    category: 'slots', rtp: '96.7%', tag: 'HOT', color: '#EC4899', accentColor: '#F9A8D4', minBet: 1, maxBet: 5000,
    playersCount: 1980, iconName: 'WandSparkles', coverImage: COVER_IMAGE, description: 'ওয়াইল্ড লক ফিচারসহ ম্যাজিক এস স্লট।'
  },
  {
    id: 'circus-joker-4096', title: 'Circus Joker 4096', titleBn: 'সার্কাস জোকার ৪০৯৬', provider: 'PRAGMATIC PLAY',
    category: 'slots', rtp: '96.4%', tag: 'POPULAR', color: '#14B8A6', accentColor: '#5EEAD4', minBet: 1, maxBet: 5000,
    playersCount: 1870, iconName: 'Laugh', coverImage: COVER_IMAGE, description: 'সার্কাস জোকার থিমে ৪০৯৬ উপায়ে জেতার স্লট।'
  },
  {
    id: 'money-coming', title: 'Money Coming', titleBn: 'মানি কামিং', provider: 'JILI',
    category: 'slots', rtp: '97.5%', tag: 'JACKPOT', color: '#D97706', accentColor: '#FFC700', minBet: 1, maxBet: 5000,
    playersCount: 3890, iconName: 'Coins', coverImage: COVER_IMAGE, description: 'গোল্ডেন জ্যাকপট এবং বিগ উইন বোনাসের স্লট।'
  },
  {
    id: 'gates-of-olympus', title: 'Gates of Olympus', titleBn: 'গেটস অফ অলিম্পাস', provider: 'PRAGMATIC PLAY',
    category: 'slots', rtp: '96.5%', tag: 'POPULAR', color: '#3B82F6', accentColor: '#93C5FD', minBet: 1, maxBet: 10000,
    playersCount: 4210, iconName: 'Zap', coverImage: COVER_IMAGE, description: 'অলিম্পাসের দেবতাদের মাল্টিপ্লায়ার স্লট।'
  },
  {
    id: 'jetx', title: 'JetX', titleBn: 'জেটএক্স', provider: 'SMARTSOFT',
    category: 'live', rtp: '97.0%', tag: 'HOT', color: '#06B6D4', accentColor: '#67E8F9', minBet: 1, maxBet: 10000,
    playersCount: 3540, iconName: 'Plane', coverImage: COVER_IMAGE, description: 'মাল্টিপ্লায়ার বাড়ার আগে ক্যাশআউট করুন।'
  },
  {
    id: 'flyx', title: 'FlyX', titleBn: 'ফ্লাইএক্স', provider: 'SPRIBE',
    category: 'live', rtp: '97.0%', tag: 'NEW', color: '#10B981', accentColor: '#6EE7B7', minBet: 1, maxBet: 10000,
    playersCount: 2780, iconName: 'TrendingUp', coverImage: COVER_IMAGE, description: 'দ্রুত ক্র্যাশ রাউন্ডে সময়মতো ক্যাশআউট করুন।'
  },
  {
    id: 'crazy-time-wheel', title: 'Crazy Time Wheel', titleBn: 'ক্রেজি টাইম হুইল', provider: 'EVOLUTION',
    category: 'live', rtp: '96.1%', tag: 'VIP', color: '#F43F5E', accentColor: '#FDA4AF', minBet: 1, maxBet: 10000,
    playersCount: 3120, iconName: 'CircleDollarSign', coverImage: COVER_IMAGE, description: 'বোনাস রাউন্ডসহ লাইভ ক্রেজি টাইম হুইল।'
  },
  {
    id: 'happy-fishing', title: 'Happy Fishing', titleBn: 'হ্যাপি ফিশিং', provider: 'SPADEGAMING',
    category: 'fishing', rtp: '96.0%', tag: 'POPULAR', color: '#0284C7', accentColor: '#38BDF8', minBet: 1, maxBet: 1500,
    playersCount: 1450, iconName: 'Fish', coverImage: COVER_IMAGE, description: 'সমুদ্রের মাছ শিকার করে পুরস্কার জিতুন।'
  },
  {
    id: 'jackpot-fishing', title: 'Jackpot Fishing', titleBn: 'জ্যাকপট ফিশিং', provider: 'JILI',
    category: 'fishing', rtp: '96.2%', tag: 'JACKPOT', color: '#0F766E', accentColor: '#5EEAD4', minBet: 1, maxBet: 2000,
    playersCount: 1760, iconName: 'Trophy', coverImage: COVER_IMAGE, description: 'বড় মাছ, বোনাস এবং জ্যাকপট রিওয়ার্ড।'
  },
];
