import { supabase } from '../config/supabase';
import type { Booking } from '../types/booking';
import { SERVICE_FEE_EGP } from '../config/constants';

interface CreateBookingInput {
  userId: string;
  connectorId: string;
  stationId: string;
  vehicleId?: string;
  fleetId?: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export const bookingService = {
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: input.userId,
        connector_id: input.connectorId,
        station_id: input.stationId,
        vehicle_id: input.vehicleId || null,
        fleet_id: input.fleetId || null,
        status: 'confirmed',
        scheduled_start: input.scheduledStart,
        scheduled_end: input.scheduledEnd,
      })
      .select('*, station:stations(*, provider:providers(*)), connector:connectors(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async getUserBookings(userId: string, status?: string): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select('*, station:stations(*, provider:providers(*)), connector:connectors(*)')
      .eq('user_id', userId)
      .order('scheduled_start', { ascending: false });
    if (status) query = (query as any).eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getBookingById(bookingId: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, station:stations(*, provider:providers(*)), connector:connectors(*)')
      .eq('id', bookingId)
      .single();
    if (error) return null;
    return data;
  },

  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    if (error) throw error;
  },

  async activateBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'active' })
      .eq('id', bookingId);
    if (error) throw error;
  },

  estimateCost(
    pricePerKwh: number,
    estimatedKwh: number,
    isFleet: boolean,
  ): { providerCost: number; serviceFee: number; total: number } {
    const providerCost = pricePerKwh * estimatedKwh;
    const serviceFee = isFleet ? 0 : SERVICE_FEE_EGP;
    return { providerCost, serviceFee, total: providerCost + serviceFee };
  },
};
