
import type { MenuItem, User } from './types';
import { UserRole } from './types';

const getEnv = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

export const SUPABASE_CONFIG = {
  URL: getEnv('VITE_SUPABASE_URL'),
  ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY'),
  BUCKET: getEnv('VITE_SUPABASE_BUCKET', 'menu-images')
};

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Rendang Daging', price: 45000, category: 'Menu Utama', image: 'https://picsum.photos/seed/rendang/400/300', isSoldOut: false },
];

export const INITIAL_USERS: User[] = [
  { id: 'o1', name: 'Andi', role: UserRole.OWNER, pin: '3333' },
];
