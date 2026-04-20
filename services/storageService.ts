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

const isUuid = (value: unknown): boolean => {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value)
  );
};

const ensureUuid = (value: unknown): string => {
  return isUuid(value) ? String(value) : crypto.randomUUID();
};

const mapOrderFromDb = (o: any): Order => ({
  id: o.id,
  customerName: o.customer_name,
  customerPhone: o.customer_phone,
  pickupDate: o.pickup_date,
  pickupTime: o.pickup_time,
  status: o.status as Order['status'],
  products: o.products,
  createdAt: o.created_at,
});

const saveCatalogList = async (
  type: CatalogType,
  items: CatalogItem[]
): Promise<void> => {
  const payload = items.map((i: CatalogItem) => ({
    id: ensureUuid(i.id),
    type,
    name: i.name,
    is_active: i.isActive,
    order_index: i.orderIndex ?? 0,
  }));

  const { error } = await supabase.from('catalog_items').upsert(payload);
  if (error) throw error;
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

      return (data || []).map(mapOrderFromDb);
    } catch (e) {
      console.error('Storage Error (Orders):', e);
      return [];
    }
  },

  getDeletedOrders: async (): Promise<Order[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(mapOrderFromDb);
    } catch (e) {
      console.error('Storage Error (Deleted Orders):', e);
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

    return mapOrderFromDb(result);
  },

  deleteOrders: async (
    ids: number[],
    deletedBy?: string,
    deleteReason?: string
  ): Promise<void> => {
    const payload: Record<string, string | null> = {
      deleted_at: new Date().toISOString(),
      restored_at: null,
      restored_by: null,
    };

    if (deletedBy && isUuid(deletedBy)) {
      payload.deleted_by = deletedBy;
    }

    if (deleteReason?.trim()) {
      payload.delete_reason = deleteReason.trim();
    }

    const { error } = await supabase
      .from('orders')
      .update(payload)
      .in('id', ids);

    if (error) throw error;
  },

  restoreOrders: async (
    ids: number[],
    restoredBy?: string
  ): Promise<void> => {
    const payload: Record<string, string | null> = {
      deleted_at: null,
      deleted_by: null,
      delete_reason: null,
      restored_at: new Date().toISOString(),
    };

    if (restoredBy && isUuid(restoredBy)) {
      payload.restored_by = restoredBy;
    }

    const { error } = await supabase
      .from('orders')
      .update(payload)
      .in('id', ids);

    if (error) throw error;
  },

  hardDeleteOrders: async (ids: number[]): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .delete()
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
      .eq('id', id)
      .is('deleted_at', null);

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
      id: ensureUuid(customer.id),
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      created_at: customer.createdAt ?? new Date().toISOString(),
    };

    const { error } = await supabase.from('customers').upsert(payload);
    if (error) throw error;
  },

  // --- EQUIPO (Usuarios) ---
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
    if (isUuid(user.id)) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: user.name,
          username: user.username,
          pin_hash: user.pin,
          role: user.role,
          is_active: user.isActive,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    } else {
      const { error } = await supabase.from('profiles').insert([
        {
          full_name: user.name,
          username: user.username,
          pin_hash: user.pin,
          role: user.role,
          is_active: user.isActive,
        },
      ]);

      if (error) {
        console.error('Error inserting user:', error);
        throw error;
      }
    }
  },

  // --- CATÁLOGOS GLOBALES ---
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

  getProductsCatalog: (): Promise<CatalogItem[]> =>
    storageService.getCatalog('product'),

  getEdgesCatalog: (): Promise<CatalogItem[]> =>
    storageService.getCatalog('edge'),

  getFillingsCatalog: (): Promise<CatalogItem[]> =>
    storageService.getCatalog('filling'),

  saveCatalogList,

  saveProductsCatalog: (items: CatalogItem[]): Promise<void> =>
    saveCatalogList('product', items),

  saveEdgesCatalog: (items: CatalogItem[]): Promise<void> =>
    saveCatalogList('edge', items),

  saveFillingsCatalog: (items: CatalogItem[]): Promise<void> =>
    saveCatalogList('filling', items),

  // --- LOGS Y PREFERENCIAS ---
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