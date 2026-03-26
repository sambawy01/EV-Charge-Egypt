import { supabase } from '../config/supabase';

export const favoriteService = {
  async getFavorites(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('station_favorites')
      .select('station_id')
      .eq('user_id', userId);
    if (error) return [];
    return (data || []).map((row: { station_id: string }) => row.station_id);
  },

  async toggleFavorite(
    userId: string,
    stationId: string,
    isFavorite: boolean
  ): Promise<void> {
    if (isFavorite) {
      await supabase
        .from('station_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('station_id', stationId);
    } else {
      await supabase
        .from('station_favorites')
        .insert({ user_id: userId, station_id: stationId });
    }
  },
};
