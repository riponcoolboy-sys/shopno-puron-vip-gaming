export interface GameItem {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  image: string;
  coverImage?: string;
  provider: string;
  rtp?: string;
  tag?: 'HOT' | 'NEW' | 'JACKPOT' | 'VIP' | 'POPULAR';
  popular?: boolean;
}

export const games: GameItem[] = [
  {
    id: 'garuda-slot',
    title: 'Garuda Fire Slot',
    titleBn: 'গারুডা ফায়ার স্লট',
    category: 'hot',
    image: '/images/garuda.png',
    coverImage: '/images/garuda.png',
    provider: 'VIP Casino',
    rtp: '96.1%',
    tag: 'HOT',
    popular: true,
  },
  {
    id: 'vip-lucky-wheel',
    title: 'VIP Lucky Wheel',
    titleBn: 'ভিআইপি লাকি হুইল',
    category: 'all',
    image: '/images/garuda.png',
    coverImage: '/images/garuda.png',
    provider: 'VIP Casino',
    rtp: '95.8%',
    tag: 'NEW',
    popular: true,
  }
];

export const GAMES_DATA = games;
export default games;