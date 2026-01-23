
export type OrderStatus = 'Recibido' | 'En elaboración' | 'Elaborado' | 'Entregado';

export type UserRole = 'ADMIN' | 'MANAGER' | 'VENDOR';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  pin: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  targetUser: string;
}

export interface Product {
  id: string;
  type: string;
  portions: number;
  edge: string;
  filling: string;
  glutenFree: boolean;
  message?: string;
}

export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  pickupDate: string;
  pickupTime: string;
  status: OrderStatus;
  products: Product[];
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  dob?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}
