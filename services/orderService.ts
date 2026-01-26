import { supabase } from './supabaseClient';
import { Order } from '../types';

const TABLE = 'orders';

export const orderService = {

  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase getAll error:', error);
      throw error;
    }

    return data as Order[];
  },

  async save(order: Order) {
    const { error } = await supabase
      .from(TABLE)
      .upsert(order, { onConflict: 'id' });

    if (error) {
      console.error('Supabase save error:', error);
      throw error;
    }
  },

  async delete(id: number) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  }
};
