import { supabase } from '../config/supabase';
import { featureFlags } from '../config/featureFlags';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RouteStop {
  stationId: string;
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
  estimatedArrival: string;
  chargeTimeMin: number;
  estimatedKwh: number;
  estimatedCost: number;
}

export interface RoutePlan {
  stops: RouteStop[];
  totalDistanceKm: number;
  totalTimeMin: number;
  totalChargeCost: number;
  summary: string;
}

export interface CostReport {
  totalSpent: number;
  period: string;
  byProvider: { provider: string; amount: number; percentage: number }[];
  savings: { description: string; amountSavable: number }[];
  tips: string[];
  monthOverMonthChange: number;
}

export interface AvailabilityPrediction {
  stationId: string;
  currentStatus: string;
  prediction: string;
  confidence: number;
  bestTimeToVisit: string;
  averageWaitMin: number;
}

export interface BatteryHealth {
  score: number;
  fastChargeRatio: number;
  avgDepthOfDischarge: number;
  recommendations: string[];
  degradationEstimate: string;
}

// Smart keyword-based mock responses for demo mode
function getMockChatResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('cheap') || lower.includes('price') || lower.includes('cost')) {
    return 'The cheapest fast chargers near Cairo right now are IKARUS Maadi at 0.04 EGP/kWh (60kW CCS) and Sha7en 6th October at 0.045 EGP/kWh (50kW CCS). IKARUS saves you about 12% vs the city average.';
  }
  if (lower.includes('gouna') || lower.includes('route') || lower.includes('trip') || lower.includes('plan') || lower.includes('alexandria')) {
    return 'For a Cairo → El Gouna trip (490km), I recommend 2 charging stops: (1) Elsewedy Plug 6th October — charge 25 min to 80% (est. 4 EGP), then (2) Elsewedy Plug Hurghada — top-up 15 min before arrival. Total charge cost: ~8 EGP. Shall I book the stops for you?';
  }
  if (lower.includes('ccs') || lower.includes('type 2') || lower.includes('connector') || lower.includes('difference')) {
    return 'CCS (Combined Charging System) supports DC fast charging up to 350kW — great for highway stops. Type 2 is AC charging, slower (up to 22kW) but common at malls and hotels. Most modern EVs in Egypt (BYD, MG, BMW) support both. CHAdeMO is mainly Nissan Leaf.';
  }
  if (lower.includes('battery') || lower.includes('health')) {
    return 'Based on your charging patterns, your battery health score is 87/100. You use DC fast charging for 35% of sessions — slightly high. Tip: try to keep fast charges under 30% of total sessions, and avoid regularly charging above 90% for best longevity.';
  }
  if (lower.includes('report') || lower.includes('monthly') || lower.includes('spending')) {
    return 'Your March 2026 charging cost was 450 EGP across 12 sessions. Elsewedy Plug was your most-used provider (40%). You could save ~75 EGP/month by switching 3 peak-hour sessions to IKARUS and charging after 9 PM.';
  }
  if (lower.includes('won\'t start') || lower.includes('error') || lower.includes('problem') || lower.includes('broken')) {
    return 'Sorry to hear about the issue! First, try: (1) Check your car is in Park, (2) Re-tap your payment method, (3) Wait 30 seconds and try again. If still stuck, I\'ve flagged this connector for review and you can try the other connector at this station. Need me to find the nearest alternative?';
  }
  if (lower.includes('provider') || lower.includes('best') || lower.includes('which')) {
    return 'Here\'s the quick comparison for Cairo:\n• IKARUS: 0.04 EGP/kWh, 60kW CCS, great coverage in Maadi & New Cairo\n• Sha7en: 0.045 EGP/kWh, 50kW, good in 6th October & Zayed\n• Elsewedy Plug: 0.05 EGP/kWh, 100kW CCS, fastest chargers\n• Kilowatt: 0.038 EGP/kWh, 40kW, best price but slower\n• New Energy: 0.042 EGP/kWh, mall locations with amenities';
  }

  return 'I can help you find charging stations, plan routes with charging stops, analyze your costs, or give battery health tips. Try asking: "Where\'s the cheapest fast charger near me?" or "Plan my trip to Alexandria".';
}

const MOCK_RESPONSES = {
  chat: (message: string) => ({ message: getMockChatResponse(message) }),
  route: {
    stops: [
      {
        stationId: 'elsewedy-6oct-1',
        stationName: 'Elsewedy Plug 6th October',
        address: 'Mall of Arabia, 6th October City',
        latitude: 29.9727,
        longitude: 30.9432,
        estimatedArrival: '2:30 PM',
        chargeTimeMin: 25,
        estimatedKwh: 22,
        estimatedCost: 1.10,
      },
      {
        stationId: 'elsewedy-hurghada-1',
        stationName: 'Elsewedy Plug Hurghada',
        address: 'Senzo Mall, Hurghada',
        latitude: 27.2579,
        longitude: 33.8116,
        estimatedArrival: '6:15 PM',
        chargeTimeMin: 20,
        estimatedKwh: 18,
        estimatedCost: 0.90,
      },
    ],
    totalDistanceKm: 490,
    totalTimeMin: 345,
    totalChargeCost: 2.0,
    summary:
      'Your trip to El Gouna (490 km) requires 2 charging stops. Total charging cost: 2.00 EGP. Drive safely and enjoy the Red Sea!',
  },
  cost: {
    totalSpent: 450,
    period: 'March 2026',
    byProvider: [
      { provider: 'Elsewedy Plug', amount: 180, percentage: 40 },
      { provider: 'IKARUS', amount: 135, percentage: 30 },
      { provider: 'Sha7en', amount: 135, percentage: 30 },
    ],
    savings: [
      { description: 'Switch 3 sessions to IKARUS (15% cheaper)', amountSavable: 45 },
      { description: 'Charge during off-peak hours (9pm–7am)', amountSavable: 30 },
    ],
    tips: [
      'Your most expensive charges were on Friday afternoons at Elsewedy Plug.',
      'Off-peak charging could save you 75 EGP/month.',
      'Kilowatt EV has the lowest per-kWh rate in your usual areas.',
    ],
    monthOverMonthChange: -5.2,
  },
  prediction: {
    stationId: '',
    currentStatus: 'available',
    prediction: 'Usually free at this time. Gets busy around 5 PM.',
    confidence: 0.85,
    bestTimeToVisit: '10:00 AM – 2:00 PM',
    averageWaitMin: 3,
  },
  battery: {
    score: 87,
    fastChargeRatio: 0.35,
    avgDepthOfDischarge: 0.6,
    recommendations: [
      'Reduce fast charging sessions to under 30% of total charges.',
      'Avoid charging above 90% regularly.',
      'Your charging pattern is generally healthy.',
    ],
    degradationEstimate: 'Estimated 3% degradation per year at current usage.',
  },
};

export const aiService = {
  async chat(
    message: string,
    userId: string,
    conversationHistory?: ChatMessage[],
  ): Promise<{ message: string }> {
    if (featureFlags.MOCK_PROVIDERS) return MOCK_RESPONSES.chat(message);

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { message, userId, history: conversationHistory?.slice(-10) },
    });
    if (error) throw error;
    return data;
  },

  async planRoute(input: {
    origin: { lat: number; lng: number };
    destination: string;
    currentBatteryPct: number;
    vehicleId: string;
    userId: string;
  }): Promise<RoutePlan> {
    if (featureFlags.MOCK_PROVIDERS) return MOCK_RESPONSES.route;

    const { data, error } = await supabase.functions.invoke('ai-route-planner', { body: input });
    if (error) throw error;
    return data;
  },

  async optimizeCosts(userId: string, period: string): Promise<CostReport> {
    if (featureFlags.MOCK_PROVIDERS) return MOCK_RESPONSES.cost;

    const { data, error } = await supabase.functions.invoke('ai-cost-optimizer', {
      body: { userId, period },
    });
    if (error) throw error;
    return data;
  },

  async predictAvailability(stationId: string): Promise<AvailabilityPrediction> {
    if (featureFlags.MOCK_PROVIDERS) return { ...MOCK_RESPONSES.prediction, stationId };

    const { data, error } = await supabase.functions.invoke('ai-predict-availability', {
      body: { stationId },
    });
    if (error) throw error;
    return data;
  },

  async analyzeBatteryHealth(userId: string, vehicleId: string): Promise<BatteryHealth> {
    if (featureFlags.MOCK_PROVIDERS) return MOCK_RESPONSES.battery;

    const { data, error } = await supabase.functions.invoke('ai-battery-health', {
      body: { userId, vehicleId },
    });
    if (error) throw error;
    return data;
  },
};
