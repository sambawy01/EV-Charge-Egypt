export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  user_id: string;
  connector_id: string;
  station_id: string;
  vehicle_id: string | null;
  fleet_id: string | null;
  provider_booking_ref: string | null;
  status: BookingStatus;
  scheduled_start: string;
  scheduled_end: string;
  created_at: string;
  station?: import('./station').Station;
  connector?: import('./station').Connector;
}

export interface ChargingSession {
  id: string;
  booking_id: string | null;
  user_id: string;
  connector_id: string;
  start_time: string;
  end_time: string | null;
  kwh_delivered: number;
  cost_provider: number;
  cost_service_fee: number;
  cost_total: number;
  payment_status: PaymentStatus;
  created_at: string;
}
