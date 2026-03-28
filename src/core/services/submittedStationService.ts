import { supabase } from '../config/supabase';

export interface SubmittedStation {
  id: string;
  submitted_by: string | null;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  provider_name: string | null;
  connector_types: string[];
  power_kw: number | null;
  notes: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verification_count: number;
  verified_by: string[];
  created_at: string;
}

export const submittedStationService = {
  async submitStation(station: {
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    city?: string;
    providerName?: string;
    connectorTypes?: string[];
    powerKw?: number;
    notes?: string;
    submittedBy?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase.from('submitted_stations').insert({
        submitted_by: station.submittedBy || null,
        name: station.name,
        address: station.address || null,
        latitude: station.latitude,
        longitude: station.longitude,
        city: station.city || null,
        provider_name: station.providerName || null,
        connector_types: station.connectorTypes || [],
        power_kw: station.powerKw || null,
        notes: station.notes || null,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[submittedStationService] Submit failed:', err);
      return false;
    }
  },

  async getPendingStations(): Promise<SubmittedStation[]> {
    try {
      const { data, error } = await supabase
        .from('submitted_stations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async verifyStation(stationId: string, userId: string): Promise<boolean> {
    try {
      // Get current station
      const { data: station, error: fetchError } = await supabase
        .from('submitted_stations')
        .select('*')
        .eq('id', stationId)
        .single();
      if (fetchError || !station) return false;

      // Check if user already verified
      if ((station.verified_by || []).includes(userId)) return false;

      const newVerifiedBy = [...(station.verified_by || []), userId];
      const newCount = newVerifiedBy.length;

      // Auto-promote to verified after 3 verifications
      const newStatus = newCount >= 3 ? 'verified' : 'pending';

      const { error } = await supabase
        .from('submitted_stations')
        .update({
          verified_by: newVerifiedBy,
          verification_count: newCount,
          status: newStatus,
        })
        .eq('id', stationId);
      if (error) throw error;

      // If verified, add to main stations table
      if (newStatus === 'verified') {
        await supabase.from('stations').insert({
          name: station.name,
          address: station.address,
          latitude: station.latitude,
          longitude: station.longitude,
          city: station.city,
          is_active: true,
          is_verified: true,
          verified_count: newCount,
          external_station_id: `user-${stationId}`,
          provider_id: '11111111-0000-0000-0000-000000000005',
        });
      }

      return true;
    } catch (err) {
      console.warn('[submittedStationService] Verify failed:', err);
      return false;
    }
  },

  async getNearbyPending(lat: number, lng: number, radiusKm: number = 5): Promise<SubmittedStation[]> {
    const all = await this.getPendingStations();
    return all.filter(s => {
      const R = 6371;
      const dLat = (s.latitude - lat) * Math.PI / 180;
      const dLon = (s.longitude - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(s.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= radiusKm;
    });
  },
};
