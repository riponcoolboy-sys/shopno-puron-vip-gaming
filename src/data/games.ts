export interface GameItem {
  id: string;
  title: string;
  category: string;
  image: string;
  provider: string;
  popular?: boolean;
}

export const GAMES_DATA: GameItem[] = [
  {
    id: 'garuda-slot',
    title: 'Garuda Fire Slot',
    category: 'Slots',
    image: '/images/garuda.png',
    provider: 'VIP Casino',
    popular: true,
  }
];