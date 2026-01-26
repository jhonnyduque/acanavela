// services/storageService.ts
import { supabase } from './supabaseClient';
import { Order, Customer } from '../types';

const ORDERS_TABLE = 'orders';
const CUSTOMERS_TABLE = 'customers';

export const storageService = {
  /* =======================
     PEDIDOS (SUPABASE)
  ======================= */

  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('getOrders error:', error);
      throw error;
    }

    // 🔁 mapear Supabase → modelo de la app
    return (data ?? []).map((row: any) => ({
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      pickupDate: row.pickup_date,
      pickupTime: row.pickup_time,
      status: row.status,
      products: [] // ⚠️ por ahora vacío (va en order_products)
    })) as Order[];
  },

  async saveOrders(orders: Order[]) {
    // 1️⃣ borrar todo (estrategia actual)
    const { error: deleteError } = await supabase
      .from(ORDERS_TABLE)
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error('deleteOrders error:', deleteError);
      throw deleteError;
    }

    // 2️⃣ mapear modelo app → columnas Supabase
    const rows = orders.map(o => ({
      id: o.id,
      customer_name: o.customerName,
      customer_phone: o.customerPhone,
      pickup_date: o.pickupDate, // YYYY-MM-DD
      pickup_time: o.pickupTime, // HH:mm
      status: o.status
    }));

    const { error: insertError } = await supabase
      .from(ORDERS_TABLE)
      .insert(rows);

    if (insertError) {
      console.error('insertOrders error:', insertError);
      throw insertError;
    }
  },

  /* =======================
     CLIENTES (SUPABASE)
  ======================= */

  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from(CUSTOMERS_TABLE)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getCustomers error:', error);
      throw error;
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      createdAt: row.created_at
    })) as Customer[];
  },

  async saveCustomers(customers: Customer[]) {
    const { error: deleteError } = await supabase
      .from(CUSTOMERS_TABLE)
      .delete()
      .neq('id', '');

    if (deleteError) {
      console.error('deleteCustomers error:', deleteError);
      throw deleteError;
    }

    const rows = customers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      created_at: c.createdAt
    }));

    const { error: insertError } = await supabase
      .from(CUSTOMERS_TABLE)
      .insert(rows);

    if (insertError) {
      console.error('insertCustomers error:', insertError);
      throw insertError;
    }
  }
};

