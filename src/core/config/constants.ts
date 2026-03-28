export const APP_NAME = 'WattsOn';
export const SERVICE_FEE_EGP = 10;
export const DEFAULT_MAP_REGION = {
  latitude: 30.0444,
  longitude: 31.2357,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
}; // Cairo center
export const STATION_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const AVAILABILITY_POLL_MS = 60 * 1000; // 60 seconds
export const CHARGING_POLL_MS = 30 * 1000; // 30 seconds

export const CREDIT_BONUSES: Record<number, number> = {
  10000: 500,
  25000: 1500,
  50000: 4000,
  100000: 12000,
};

export const FLEET_PLANS = {
  starter: {
    price: 0,
    maxVehicles: 5,
    features: ['basic_tracking', 'manual_booking'],
  },
  business: {
    price: 1500,
    maxVehicles: 25,
    features: ['ai_scheduling', 'reports', 'priority_booking', 'waived_fee', 'driver_limits'],
  },
  enterprise: {
    price: 10000,
    maxVehicles: Infinity,
    features: ['all_business', 'credit_system', 'battery_health', 'account_manager', 'custom_api', 'white_label'],
  },
} as const;
