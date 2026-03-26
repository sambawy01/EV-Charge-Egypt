import { supabase } from '../config/supabase';
import type { Vehicle } from '../types/fleet';

interface AddVehicleInput {
  userId: string;
  fleetId?: string;
  make: string;
  model: string;
  year?: number;
  batteryCapacityKwh: number;
  connectorTypes: string[];
  licensePlate?: string;
}

export const vehicleService = {
  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addVehicle(input: AddVehicleInput): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        user_id: input.userId,
        fleet_id: input.fleetId || null,
        make: input.make,
        model: input.model,
        year: input.year || null,
        battery_capacity_kwh: input.batteryCapacityKwh,
        connector_types: input.connectorTypes,
        license_plate: input.licensePlate || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteVehicle(vehicleId: string): Promise<void> {
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
    if (error) throw error;
  },

  async updateVehicle(vehicleId: string, updates: Partial<AddVehicleInput>): Promise<void> {
    const { error } = await supabase.from('vehicles').update(updates).eq('id', vehicleId);
    if (error) throw error;
  },
};
