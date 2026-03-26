import { supabase } from '../config/supabase';
import type { Review } from '../types/station';

export const reviewService = {
  async getStationReviews(stationId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, user:user_profiles(full_name, avatar_url)')
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createReview(
    userId: string,
    stationId: string,
    rating: number,
    comment?: string,
  ): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({ user_id: userId, station_id: stationId, rating, comment: comment || null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
