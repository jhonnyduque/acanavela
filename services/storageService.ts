import { supabase } from './supabaseClient';
import {
  Order,
  Customer,
  AppUser,
  AuditLogEntry,
  CatalogItem,
  SortPrefs,
} from '../types';

type OrderRow = {
  id: number;
  customer_name: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  status: string;
  products: Order['products'];
  created_at: string;
};

type CustomerRow = {
  id: number | string;
  name: string;
  phone: string;
  email?: string | null;
  created_at?: string | null;
};

type AppUserRow = {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: AppUser['role'];
  is_active: boolean | null;
};

type CatalogRow = {
  id: number | string;
  name: string;
  is_active: boolean;
  created_at?: string | null;
  order_index?: number | null;
};

type AuditLogRow = {
  id: number | string;
  action: string;
  performed_by: string;
  target_user?: string | null;
  timestamp: string;
};

type SortPrefsRow = {
  data: SortPrefs;
};

type AppUserPayload = {
  name: string;
  username: string;
  pin: string;
  role: AppUser['role'];
  is_active: boolean;
};

type CatalogTable = 'catalog_products' | 'catalog_edges' | 'catalog_fillings';

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
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as OrderRow[];

      return rows.map((o: OrderRow): Order => ({
        id: o.id,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        pickupDate: o.pickup_date,
        pickupTime: o.pickup_time,
        status: o.status,
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

    let result: OrderRow;

    if (order.id && order.id > 0) {
      const { data, error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;
      result = data as OrderRow;
    } else {
      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      result = data as OrderRow;
    }

    return {
      id: result.id,
      customerName: result.customer_name,
      customerPhone: result.customer_phone,
      pickupDate: result.pickup_date,
      pickupTime: result.pickup_time,
      status: result.status,
      products: result.products,
      createdAt: result.created_at,
    };
  },

  deleteOrders: async (ids: number[]): Promise<void> => {
    const { error } = await supabase.from('orders').delete().in('id', ids);
    if (error) throw error;
  },

  updateOrderStatus: async (id: number, status: string): Promise<void> => {
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

      const rows = (data ?? []) as CustomerRow[];
      return rows as Customer[];
    } catch (e) {
      console.error('Error fetching customers:', e);
      return [];
    }
  },

  saveCustomer: async (customer: Customer): Promise<void> => {
    const { error } = await supabase.from('customers').upsert({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      created_at: customer.createdAt,
    });

    if (error) throw error;
  },

  // --- EQUIPO (Usuarios) ---
  getUsers: async (): Promise<AppUser[]> => {
    try {
      const { data, error } = await supabase.from('app_users').select('*');

      if (error) throw error;

      const rows = (data ?? []) as AppUserRow[];

      return rows.map((u: AppUserRow): AppUser => ({
        id: u.id,
        name: u.name,
        username: u.username,
        pin: u.pin,
        role: u.role,
        isActive: u.is_active ?? true,
      }));
    } catch (e) {
      console.warn('Error fetching users:', e);
      return [];
    }
  },

  saveUser: async (user: AppUser): Promise<void> => {
    const payload: AppUserPayload = {
      name: user.name,
      username: user.username,
      pin: user.pin,
      role: user.role,
      is_active: user.isActive,
    };

    if (user.id && user.id.includes('-')) {
      const { error } = await supabase
        .from('app_users')
        .update(payload)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    } else {
      const { error } = await supabase.from('app_users').insert([payload]);

      if (error) {
        console.error('Error inserting user:', error);
        throw error;
      }
    }
  },

  // --- CATÁLOGOS GLOBALES ---
  getCatalog: async (table: CatalogTable): Promise<CatalogItem[]> => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as CatalogRow[];

      return rows.map((i: CatalogRow): CatalogItem => ({
        id: i.id,
        name: i.name,
        isActive: i.is_active,
        createdAt: i.created_at ?? undefined,
        orderIndex: i.order_index ?? 0,
      }));
    } catch (e) {
      console.error(`Error loading ${table}:`, e);
      return [];
    }
  },

  getProductsCatalog: (): Promise<CatalogItem[]> =>
    storageService.getCatalog('catalog_products'),

  getEdgesCatalog: (): Promise<CatalogItem[]> =>
    storageService.getCatalog('catalog_edges'),

  getFillingsCatalog: (): Promise<CatalogItem[]> =>
    storageService.getCatalog('catalog_fillings'),

  saveCatalogList: async (
    table: CatalogTable,
    items: CatalogItem[]
  ): Promise<void> => {
    const payload = items.map((i: CatalogItem) => ({
      id: i.id,
      name: i.name,
      is_active: i.isActive,
      order_index: i.orderIndex,
    }));

    const { error } = await supabase.from(table).upsert(payload);
    if (error) throw error;
  },

  saveProductsCatalog: (items: CatalogItem[]): Promise<void> =>
    storageService.saveCatalogList('catalog_products', items),

  saveEdgesCatalog: (items: CatalogItem[]): Promise<void> =>
    storageService.saveCatalogList('catalog_edges', items),

  saveFillingsCatalog: (items: CatalogItem[]): Promise<void> =>
    storageService.saveCatalogList('catalog_fillings', items),

  // --- LOGS Y PREFERENCIAS ---
  getLogs: async (): Promise<AuditLogEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) return [];

      const rows = (data ?? []) as AuditLogRow[];

      return rows.map((l: AuditLogRow): AuditLogEntry => ({
        id: l.id,
        action: l.action,
        performedBy: l.performed_by,
        targetUser: l.target_user ?? undefined,
        timestamp: l.timestamp,
      }));
    } catch (e) {
      console.error('Error fetching logs:', e);
      return [];
    }
  },

  addLog: async (
    log: Omit<AuditLogEntry, 'id' | 'timestamp'>
  ): Promise<void> => {
    try {
      await supabase.from('audit_log').insert([
        {
          action: log.action,
          performed_by: log.performedBy,
          target_user: log.targetUser,
        },
      ]);
    } catch (e) {
      console.error('Error adding log:', e);
    }
  },

  getSortPrefs: async (): Promise<SortPrefs> => {
    try {
      const { data, error } = await supabase
        .from('app_preferences')
        .select('data')
        .eq('key', 'sort_preferences')
        .single();

      if (error) return DEFAULT_SORT_PREFS;

      const row = data as SortPrefsRow | null;
      return row?.data ?? DEFAULT_SORT_PREFS;
    } catch (e) {
      console.error('Error fetching sort preferences:', e);
      return DEFAULT_SORT_PREFS;
    }
  },

  saveSortPrefs: async (prefs: SortPrefs): Promise<void> => {
    try {
      await supabase.from('app_preferences').upsert({
        key: 'sort_preferences',
        data: prefs,
      });
    } catch (e) {
      console.error('Error saving sort preferences:', e);
    }
  },
};