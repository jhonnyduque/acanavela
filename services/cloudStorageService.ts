import { supabase } from './supabaseClient';
import { Order } from '../types';

export async function getOrdersFromCloud(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders from Supabase:', error);
    throw error;
  }

  return data as Order[];
}
