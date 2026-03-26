import { supabase } from '../config/supabase';
import type { UserProfile } from '../types/auth';

export const profileService = {
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  },

  async getChargingStats(
    userId: string,
  ): Promise<{
    totalSessions: number;
    totalKwh: number;
    totalSpent: number;
    co2SavedKg: number;
  }> {
    const { data, error } = await supabase
      .from('charging_sessions')
      .select('kwh_delivered, cost_total')
      .eq('user_id', userId)
      .not('end_time', 'is', null);
    if (error) throw error;

    const sessions = data || [];
    const totalKwh = sessions.reduce((sum, s) => sum + (s.kwh_delivered || 0), 0);
    const totalSpent = sessions.reduce((sum, s) => sum + (s.cost_total || 0), 0);
    // kWh × 0.5 kg CO2 vs petrol equivalent
    const co2SavedKg = totalKwh * 0.5;

    return { totalSessions: sessions.length, totalKwh, totalSpent, co2SavedKg };
  },
};
