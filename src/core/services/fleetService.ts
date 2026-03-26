import { supabase } from '../config/supabase';
import type { Fleet, FleetMember, Vehicle } from '../types/fleet';
import type { ChargingSession } from '../types/booking';

export const fleetService = {
  async getFleetByOwner(ownerId: string): Promise<Fleet | null> {
    const { data, error } = await supabase.from('fleets').select('*').eq('owner_id', ownerId).single();
    if (error) return null;
    return data;
  },

  async createFleet(ownerId: string, companyName: string): Promise<Fleet> {
    const { data, error } = await supabase
      .from('fleets')
      .insert({ owner_id: ownerId, company_name: companyName })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getFleetVehicles(fleetId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('fleet_id', fleetId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getFleetMembers(fleetId: string): Promise<FleetMember[]> {
    const { data, error } = await supabase
      .from('fleet_members')
      .select('*, user:user_profiles(full_name, avatar_url, phone), vehicle:vehicles(*)')
      .eq('fleet_id', fleetId)
      .order('is_active', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addFleetMember(
    fleetId: string,
    userId: string,
    vehicleId?: string,
    dailyLimit?: number,
    weeklyLimit?: number,
  ): Promise<FleetMember> {
    const { data, error } = await supabase
      .from('fleet_members')
      .insert({
        fleet_id: fleetId,
        user_id: userId,
        vehicle_id: vehicleId || null,
        daily_limit: dailyLimit || null,
        weekly_limit: weeklyLimit || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeFleetMember(memberId: string): Promise<void> {
    const { error } = await supabase.from('fleet_members').update({ is_active: false }).eq('id', memberId);
    if (error) throw error;
  },

  async assignVehicle(memberId: string, vehicleId: string): Promise<void> {
    const { error } = await supabase.from('fleet_members').update({ vehicle_id: vehicleId }).eq('id', memberId);
    if (error) throw error;
  },

  async getFleetSessions(fleetId: string, _startDate?: string, _endDate?: string): Promise<ChargingSession[]> {
    const { data, error } = await supabase
      .from('charging_sessions')
      .select('*, connector:connectors(*, station:stations(*, provider:providers(*))), booking:bookings(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getFleetDashboardStats(fleetId: string): Promise<{
    totalVehicles: number;
    activeCharging: number;
    lowBattery: number;
    todaySpending: number;
    monthlyBudget: number;
    alerts: string[];
  }> {
    const vehicles = await this.getFleetVehicles(fleetId);
    return {
      totalVehicles: vehicles.length,
      activeCharging: 0,
      lowBattery: 0,
      todaySpending: 0,
      monthlyBudget: 0,
      alerts: [],
    };
  },

  async updateFleetPlan(fleetId: string, plan: string): Promise<void> {
    const { error } = await supabase.from('fleets').update({ plan }).eq('id', fleetId);
    if (error) throw error;
  },
};
