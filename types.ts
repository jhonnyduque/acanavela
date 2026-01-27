
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

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  { category: "Artistic", label: "Cyberpunk Cityscape", prompt: "A hyper-detailed cyberpunk city at night, rain-slicked streets reflecting neon signs in magenta and teal, cinematic lighting, 8k resolution, volumetric fog." },
  { category: "Artistic", label: "Surreal Floating Islands", prompt: "Surreal oil painting of floating islands with waterfalls falling into the void, cosmic nebula background, whimsical atmosphere, Salvador Dali style." },
  { category: "Minimalist", label: "Geometric Still Life", prompt: "Minimalist geometric still life, soft pastel colors, clean lines, brutalist architecture influence, soft studio lighting, high-end photography." },
  { category: "Nature", label: "Bioluminescent Forest", prompt: "Mystical bioluminescent forest at twilight, glowing plants and fungi, ethereal light beams, macro photography, shallow depth of field." },
  { category: "Abstract", label: "Liquid Gold Flow", prompt: "Macro abstract of liquid gold and iridescent ink swirling together, luxurious textures, glossy finish, intricate details, high contrast." },
  { category: "Character", label: "Cybernetic Samurai", prompt: "Portrait of a cybernetic samurai, ornate armor with glowing circuitry, dramatic rim lighting, traditional Japanese aesthetic meets futuristic tech." },
];
