
export type ImageEntry = {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
};

export type PromptTemplate = {
  label: string;
  prompt: string;
  category: string;
};

// Tipos para la gestión de usuarios y roles
export type UserRole = 'ADMIN' | 'MANAGER' | 'VENDOR';

export type AppUser = {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: UserRole;
  isActive: boolean;
};

// Tipos para el flujo de pedidos
export type OrderStatus = 'Recibido' | 'En elaboración' | 'Elaborado' | 'Entregado';

export type Product = {
  id: string;
  type: string;
  portions: number;
  edge: string;
  filling: string;
  glutenFree: boolean;
  message: string;
};

export type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  pickupDate: string;
  pickupTime: string;
  status: OrderStatus;
  products: Product[];
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
};

export type AuditLogEntry = {
  id: number;
  action: string;
  performedBy: string;
  targetUser: string;
  timestamp: string;
};

export type CatalogItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  orderIndex: number;
};

// --- NUEVOS TIPOS DE REFINAMIENTO ---
export type SortOption = 'name' | 'orders' | 'manual';

export type SortPrefs = {
  products: SortOption;
  edges: SortOption;
  fillings: SortOption;
};


