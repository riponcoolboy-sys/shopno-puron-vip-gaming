export interface GameItem {
  id: string;
  title: string;
  category: string;
  image: string;
  provider: string;
  popular?: boolean;
}

export const games: GameItem[] = [
  {
    id: 'garuda-slot',
    title: 'Garuda Fire Slot',
    category: 'Slots',
    image: '/images/garuda.png',
    provider: 'VIP Casino',
    popular: true,
  }
];

export const GAMES_DATA = games;
export default games;