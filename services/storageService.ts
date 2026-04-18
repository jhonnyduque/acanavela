import { supabase } from './supabaseClient';
import {
  Order,
  Customer,
  AppUser,
  AuditLogEntry,
  CatalogItem,
  SortPrefs,
} from '../types';

type CatalogType = 'product' | 'edge' | 'filling';

const DEFAULT_SORT_PREFS: SortPrefs = {
  products: 'manual',
  edges: 'manual',
  fillings: 'manual',
};

export const storageService = {
  // --- ÓRDENES (Pedidos) ---
  getOrders: async (): Promise<Order[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .is('deleted_at', null)
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true });

      if (error) throw error;

      return (data || []).map((o: any) => ({
        id: o.id,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        pickupDate: o.pickup_date,
        pickupTime: o.pickup_time,
        status: o.status as Order['status'],
        products: o.products,
        createdAt: o.created_at,
      }));
    } catch (e) {
      console.error('Storage Error (Orders):', e);
      return [];
    }
  },

  saveOrder: async (order: Order): Promise<Order> => {
    const payload = {
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      pickup_date: order.pickupDate,
      pickup_time: order.pickupTime,
      status: order.status,
      products: order.products,
    };

    let result: any;

    if (order.id && order.id > 0) {
      const { data, error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return {
      id: result.id,
      customerName: result.customer_name,
      customerPhone: result.customer_phone,
      pickupDate: result.pickup_date,
      pickupTime: result.pickup_time,
      status: result.status as Order['status'],
      products: result.products,
      createdAt: result.created_at,
    };
  },

  deleteOrders: async (ids: number[]): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
  },

  updateOrderStatus: async (
    id: number,
    status: Order['status']
  ): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  // --- CLIENTES ---
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;

      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email ?? '',
        createdAt: c.created_at,
      })) as Customer[];
    } catch (e) {
      console.error('Error fetching customers:', e);
      return [];
    }
  },

  saveCustomer: async (customer: Customer): Promise<void> => {
    const payload = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      created_at: customer.createdAt,
    };

    const { error } = await supabase.from('customers').upsert(payload);
    if (error) throw error;
  },

  // --- EQUIPO (Usuarios) ---
  // La tabla real es profiles, no app_users
  getUsers: async (): Promise<AppUser[]> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;

      return (data || []).map((u: any) => ({
        id: u.id,
        name: u.full_name ?? '',
        username: u.username,
        pin: u.pin_hash ?? '',
        role: u.role,
        isActive: u.is_active ?? true,
      }));
    } catch (e) {
      console.warn('Error fetching users:', e);
      return [];
    }
  },

  saveUser: async (user: AppUser): Promise<void> => {
    const payload = {
      full_name: user.name,
      username: user.username,
      pin_hash: user.pin,
      role: user.role,
      is_active: user.isActive,
    };

    if (user.id && user.id.includes('-')) {
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    } else {
      const { error } = await supabase.from('profiles').insert([payload]);

      if (error) {
        console.error('Error inserting user:', error);
        throw error;
      }
    }
  },

  // --- CATÁLOGOS GLOBALES ---
  // La tabla real es catalog_items, separada por type
  getCatalog: async (type: CatalogType): Promise<CatalogItem[]> => {
    try {
      const { data, error } = await supabase
        .from('catalog_items')
        .select('*')
        .eq('type', type)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return (data || []).map((i: any) => ({
        id: String(i.id),
        name: i.name,
        isActive: i.is_active,
        createdAt: i.created_at ?? '',
        orderIndex: i.order_index ?? 0,
      }));
    } catch (e) {
      console.error(`Error loading catalog type ${type}:`, e);
      return [];
    }
  },

  getProductsCatalog: () => storageService.getCatalog('product'),
  getEdgesCatalog: () => storageService.getCatalog('edge'),
  getFillingsCatalog: () => storageService.getCatalog('filling'),

  saveCatalogList: async (
    type: CatalogType,
    items: CatalogItem[]
  ): Promise<void> => {
    const payload = items.map((i: CatalogItem) => ({
      id: i.id && i.id.includes('-') ? i.id : null,
      type,
      name: i.name,
      is_active: i.isActive,
      order_index: i.orderIndex,
    }));

    const { error } = await supabase.from('catalog_items').upsert(payload);
    if (error) throw error;
  },

  saveProductsCatalog: (items: CatalogItem[]) =>
    storageService.saveCatalogList('product', items),

  saveEdgesCatalog: (items: CatalogItem[]) =>
    storageService.saveCatalogList('edge', items),

  saveFillingsCatalog: (items: CatalogItem[]) =>
    storageService.saveCatalogList('filling', items),

  // --- LOGS Y PREFERENCIAS ---
  // Estas tablas no existen en tu base actual, así que devolvemos fallback
  getLogs: async (): Promise<AuditLogEntry[]> => {
    return [];
  },

  addLog: async (_log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> => {
    return;
  },

  getSortPrefs: async (): Promise<SortPrefs> => {
    return DEFAULT_SORT_PREFS;
  },

  saveSortPrefs: async (_prefs: SortPrefs): Promise<void> => {
    return;
  },
};