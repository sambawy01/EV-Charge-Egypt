import { supabase } from '../config/supabase';

export interface HomeCharger {
  id: string;
  user_id: string;
  display_name: string;
  address: string;
  latitude: number;
  longitude: number;
  connector_type: string;
  power_kw: number;
  description: string | null;
  availability_schedule: string | null;
  is_free: boolean;
  price_per_kwh: number | null;
  photos: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomeChargerInput {
  user_id: string;
  display_name: string;
  address: string;
  latitude: number;
  longitude: number;
  connector_type: string;
  power_kw?: number;
  description?: string;
  availability_schedule?: string;
  is_free?: boolean;
  price_per_kwh?: number;
}

// In-memory cache
let _cache: { chargers: HomeCharger[]; fetchedAt: number } | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const homeChargerService = {
  /**
   * Fetch all active home chargers (public listing).
   */
  async listHomeChargers(): Promise<HomeCharger[]> {
    // Use cache if fresh
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) {
      return _cache.chargers;
    }

    try {
      const { data, error } = await supabase
        .from('home_chargers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const chargers = (data || []) as HomeCharger[];
      _cache = { chargers, fetchedAt: Date.now() };
      return chargers;
    } catch (err) {
      console.warn('[homeChargerService] listHomeChargers failed:', err);
      return _cache?.chargers || [];
    }
  },

  /**
   * Fetch chargers belonging to a specific user (includes inactive).
   */
  async getMyChargers(userId: string): Promise<HomeCharger[]> {
    try {
      const { data, error } = await supabase
        .from('home_chargers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as HomeCharger[];
    } catch (err) {
      console.warn('[homeChargerService] getMyChargers failed:', err);
      return [];
    }
  },

  /**
   * Add a new home charger listing.
   */
  async addCharger(data: HomeChargerInput): Promise<HomeCharger | null> {
    try {
      const { data: inserted, error } = await supabase
        .from('home_chargers')
        .insert({
          user_id: data.user_id,
          display_name: data.display_name,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          connector_type: data.connector_type,
          power_kw: data.power_kw ?? 7,
          description: data.description || null,
          availability_schedule: data.availability_schedule || null,
          is_free: data.is_free ?? true,
          price_per_kwh: data.price_per_kwh || null,
        })
        .select()
        .single();

      if (error) throw error;
      // Invalidate cache
      _cache = null;
      return inserted as HomeCharger;
    } catch (err) {
      console.warn('[homeChargerService] addCharger failed:', err);
      return null;
    }
  },

  /**
   * Update an existing charger listing.
   */
  async updateCharger(id: string, updates: Partial<HomeChargerInput>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('home_chargers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      _cache = null;
      return true;
    } catch (err) {
      console.warn('[homeChargerService] updateCharger failed:', err);
      return false;
    }
  },

  /**
   * Toggle a charger's active status.
   */
  async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('home_chargers')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      _cache = null;
      return true;
    } catch (err) {
      console.warn('[homeChargerService] toggleActive failed:', err);
      return false;
    }
  },

  /**
   * Delete a charger listing permanently.
   */
  async deleteCharger(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('home_chargers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      _cache = null;
      return true;
    } catch (err) {
      console.warn('[homeChargerService] deleteCharger failed:', err);
      return false;
    }
  },

  /**
   * Invalidate the cache (e.g., after real-time update).
   */
  invalidateCache() {
    _cache = null;
  },
};
