export type FleetPlan = 'starter' | 'business' | 'enterprise';

export interface Fleet {
  id: string;
  owner_id: string;
  company_name: string;
  plan: FleetPlan;
  credit_balance: number;
  auto_topup_threshold: number | null;
  auto_topup_amount: number | null;
  created_at: string;
}

export interface FleetMember {
  id: string;
  fleet_id: string;
  user_id: string;
  vehicle_id: string | null;
  daily_limit: number | null;
  weekly_limit: number | null;
  is_active: boolean;
  user?: import('./auth').UserProfile;
}

export interface Vehicle {
  id: string;
  user_id: string;
  fleet_id: string | null;
  make: string;
  model: string;
  year: number | null;
  battery_capacity_kwh: number;
  connector_types: string[];
  license_plate: string | null;
  created_at: string;
}
