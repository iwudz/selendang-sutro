// Order Status Constants
export const OrderStatus = {
  NEW_ORDER: 'NEW_ORDER',
  COOKING: 'COOKING',
  SERVED: 'SERVED',
  PAID: 'PAID'
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// User Role Constants
export const UserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  WAITER: 'WAITER'
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

// Payment Method Constants
export const PaymentMethod = {
  CASH: 'CASH',
  QRIS: 'QRIS'
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

// Menu Category Constants
export const MenuCategory = {
  MENU_UTAMA: 'Menu Utama',
  CAMILAN: 'Camilan',
  MINUMAN_DINGIN: 'Minuman Dingin',
  MINUMAN_PANAS: 'Minuman Panas'
} as const;
export type MenuCategory = typeof MenuCategory[keyof typeof MenuCategory];

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  image: string;
  isSoldOut: boolean;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  notes: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: number;
  verifiedAt?: number;
  servedAt?: number;
  paidAt?: number;
  waiterId: string;
  paymentMethod?: PaymentMethod;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}