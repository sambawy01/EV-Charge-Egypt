export const featureFlags = {
  AI_ASSISTANT: true,
  FLEET_MANAGEMENT: true,
  ADS_ENABLED: false,
  ARABIC_RTL: false,
  OFFLINE_MODE: true,
  MOCK_PROVIDERS: true, // Use mock adapters instead of real APIs
  PUSH_NOTIFICATIONS: true,
  AUTO_TOPUP: true,
  BATTERY_HEALTH: true,
  SMART_SCHEDULING: true,
  // Vehicle analysis (battery health, consumption, charging patterns) currently
  // returns seeded-pseudo-random estimates derived from EV spec + age. The UI
  // must surface a "demo" badge while this is true. Flip to false only when
  // analytics are derived from real charging_sessions telemetry.
  SIMULATED_VEHICLE_ANALYSIS: true,
} as const;
