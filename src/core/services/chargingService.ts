import { supabase } from '../config/supabase';
import type { ChargingSession } from '../types/booking';
import { SERVICE_FEE_EGP } from '../config/constants';

interface StartSessionInput {
  bookingId: string;
  userId: string;
  connectorId: string;
}

export const chargingService = {
  async startSession(input: StartSessionInput): Promise<ChargingSession> {
    const { data, error } = await supabase
      .from('charging_sessions')
      .insert({
        booking_id: input.bookingId,
        user_id: input.userId,
        connector_id: input.connectorId,
        start_time: new Date().toISOString(),
        kwh_delivered: 0,
        cost_provider: 0,
        cost_service_fee: SERVICE_FEE_EGP,
        cost_total: 0,
        payment_status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async stopSession(
    sessionId: string,
    kwhDelivered: number,
    pricePerKwh: number,
    isFleet: boolean,
  ): Promise<ChargingSession> {
    const costProvider = kwhDelivered * pricePerKwh;
    const serviceFee = isFleet ? 0 : SERVICE_FEE_EGP;
    const costTotal = costProvider + serviceFee;

    const { data, error } = await supabase
      .from('charging_sessions')
      .update({
        end_time: new Date().toISOString(),
        kwh_delivered: kwhDelivered,
        cost_provider: costProvider,
        cost_service_fee: serviceFee,
        cost_total: costTotal,
        payment_status: 'completed',
      })
      .eq('id', sessionId);
    if (error) throw error;
    return data as any;
  },

  async getActiveSession(userId: string): Promise<ChargingSession | null> {
    const { data, error } = await supabase
      .from('charging_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('end_time', null)
      .single();
    if (error) return null;
    return data;
  },

  subscribeToSession(
    sessionId: string,
    onUpdate: (session: ChargingSession) => void,
  ) {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'charging_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => onUpdate(payload.new as ChargingSession),
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  },
};
