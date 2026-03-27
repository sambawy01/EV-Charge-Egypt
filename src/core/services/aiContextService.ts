import { evDatabase } from '../data/evDatabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserContext {
  // Vehicle state
  estimatedBatteryPercent: number;
  vehicleMake: string;
  vehicleModel: string;
  batteryCapacityKwh: number;
  rangeKm: number;
  maxChargingKw: number;

  // Location
  latitude: number | null;
  longitude: number | null;

  // Time context
  hour: number;
  dayOfWeek: string;
  isWeekend: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';

  // Charging patterns (simulated from vehicle age)
  avgChargesPerWeek: number;
  preferredChargingTime: string;
  avgCostPerCharge: number;
  totalChargesThisMonth: number;
  monthlySpend: number;

  // Preferences (inferred)
  prefersFastCharging: boolean;
  pricesSensitive: boolean;
}

export interface StationRecommendation {
  stationId: string;
  stationName: string;
  score: number; // 0-100 AI compatibility score
  reasons: string[];
  distance_km?: number;
  estimatedWaitMin: number;
  bestTimeToVisit: string;
  priceSavings?: string; // e.g. "15% cheaper than your usual"
}

export interface ProactiveInsight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'positive' | 'alert';
  action?: { label: string; screen: string; params?: any };
  priority: number; // 1-10, higher = more important
  timestamp: Date;
}

export interface SmartBookingSuggestion {
  suggestedTime: string;
  reason: string;
  savings?: string;
  conflictWarning?: string;
}

export interface WalletInsight {
  monthlyTrend: 'up' | 'down' | 'stable';
  trendPercent: number;
  trendReason: string;
  suggestedTopUp: number;
  costOptimizationTip: string;
  potentialMonthlySavings: number;
}

// ---------------------------------------------------------------------------
// Deterministic seeded random for consistent results per user
// ---------------------------------------------------------------------------

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return (h % 10000) / 10000;
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const aiContextService = {
  /**
   * Build user context from available data
   */
  buildContext(
    vehicle: any,
    location: { latitude: number; longitude: number } | null,
  ): UserContext {
    const now = new Date();
    const hour = now.getHours();
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayOfWeek = days[now.getDay()];
    const isWeekend = now.getDay() === 5 || now.getDay() === 6; // Friday/Saturday in Egypt

    const spec = vehicle
      ? evDatabase.find(
          (ev) =>
            ev.make.toLowerCase() === vehicle.make?.toLowerCase() &&
            ev.model.toLowerCase() === vehicle.model?.toLowerCase(),
        )
      : null;

    const rand = seededRandom(vehicle?.id || 'default');
    // const vehicleAge = vehicle?.year ? now.getFullYear() - vehicle.year : 2;

    // Estimate current battery based on time since "last charge" (simulated)
    const hoursSinceCharge = 8 + rand() * 40; // 8-48 hours
    const dailyUsagePercent = 15 + rand() * 20; // 15-35% per day
    const estimatedDrain = (hoursSinceCharge / 24) * dailyUsagePercent;
    const estimatedBattery = Math.max(Math.round(95 - estimatedDrain), 10);

    const timeOfDay: UserContext['timeOfDay'] =
      hour < 6
        ? 'night'
        : hour < 12
          ? 'morning'
          : hour < 18
            ? 'afternoon'
            : 'evening';

    return {
      estimatedBatteryPercent: estimatedBattery,
      vehicleMake: vehicle?.make || 'Unknown',
      vehicleModel: vehicle?.model || 'EV',
      batteryCapacityKwh:
        vehicle?.battery_capacity_kwh || spec?.batteryCapacityKwh || 60,
      rangeKm:
        spec?.rangeKm ||
        Math.round((vehicle?.battery_capacity_kwh || 60) * 6.5),
      maxChargingKw: spec?.maxChargingKw || 50,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      hour,
      dayOfWeek,
      isWeekend,
      timeOfDay,
      avgChargesPerWeek: Math.round((2 + rand() * 3) * 10) / 10,
      preferredChargingTime:
        hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening',
      avgCostPerCharge: Math.round(80 + rand() * 120),
      totalChargesThisMonth: Math.round(6 + rand() * 10),
      monthlySpend: Math.round(600 + rand() * 800),
      prefersFastCharging: rand() > 0.5,
      pricesSensitive: rand() > 0.4,
    };
  },

  /**
   * Score and recommend stations for this user
   */
  recommendStations(
    stations: any[],
    context: UserContext,
  ): StationRecommendation[] {
    const rand = seededRandom(context.vehicleMake + context.vehicleModel);

    return stations
      .slice(0, 20)
      .map((station) => {
        let score = 50;
        const reasons: string[] = [];

        // Distance bonus (closer = higher score)
        if (station.distance_km != null) {
          if (station.distance_km < 3) {
            score += 25;
            reasons.push('Very close to you');
          } else if (station.distance_km < 10) {
            score += 15;
            reasons.push('Nearby');
          } else if (station.distance_km < 20) {
            score += 5;
          }
        }

        // Connector compatibility
        const stationConnectors = (station.connectors || []).map((c: any) =>
          c.type?.toLowerCase(),
        );
        if (stationConnectors.some((t: string) => t?.includes('ccs'))) {
          score += 10;
          reasons.push('Has CCS fast charging');
        }

        // Power match
        const maxPower = Math.max(
          ...(station.connectors || []).map((c: any) => c.power_kw || 0),
          0,
        );
        if (maxPower >= context.maxChargingKw) {
          score += 10;
          reasons.push(
            `Supports your max ${context.maxChargingKw}kW charge speed`,
          );
        }

        // Time-based scoring
        if (context.hour >= 22 || context.hour < 6) {
          score += 5;
          reasons.push('Off-peak rates likely available');
        }

        // Availability
        if (station.status === 'available') {
          score += 15;
          reasons.push('Currently available');
        } else if (station.status === 'partial') {
          score += 5;
        }

        // Price sensitivity
        if (context.pricesSensitive && maxPower <= 22) {
          score += 5;
          reasons.push('Slower but cheaper AC charging');
        }

        score = Math.min(score, 99);

        const estimatedWaitMin =
          station.status === 'available'
            ? 0
            : station.status === 'partial'
              ? Math.round(5 + rand() * 15)
              : Math.round(15 + rand() * 30);

        const bestHour = 20 + Math.round(rand() * 3); // 8-11 PM range
        const bestTimeToVisit = `${bestHour > 12 ? bestHour - 12 : bestHour}:00 ${bestHour >= 12 ? 'PM' : 'AM'}`;

        const priceSavings =
          rand() > 0.6
            ? `${Math.round(10 + rand() * 20)}% cheaper than average`
            : undefined;

        return {
          stationId: station.id,
          stationName: station.name,
          score,
          reasons: reasons.slice(0, 3),
          distance_km: station.distance_km,
          estimatedWaitMin,
          bestTimeToVisit,
          priceSavings,
        };
      })
      .sort((a, b) => b.score - a.score);
  },

  /**
   * Generate proactive insights based on current context
   */
  generateInsights(context: UserContext): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];
    const now = new Date();

    // Battery alert
    if (context.estimatedBatteryPercent < 30) {
      insights.push({
        id: 'low-battery',
        icon: '\u{1FAAB}',
        title: 'Battery Running Low',
        description: `Your ${context.vehicleMake} ${context.vehicleModel} is estimated at ~${context.estimatedBatteryPercent}%. Consider charging soon — you have about ${Math.round((context.estimatedBatteryPercent * context.rangeKm) / 100)} km range left.`,
        type: 'alert',
        action: { label: 'Find Nearest Charger', screen: 'MapTab' },
        priority: 9,
        timestamp: now,
      });
    } else if (context.estimatedBatteryPercent < 50) {
      insights.push({
        id: 'medium-battery',
        icon: '\u{1F50B}',
        title: 'Battery at ~' + context.estimatedBatteryPercent + '%',
        description: `About ${Math.round((context.estimatedBatteryPercent * context.rangeKm) / 100)} km range remaining. Good time to plan your next charge.`,
        type: 'tip',
        priority: 5,
        timestamp: now,
      });
    }

    // Time-based tips
    if (context.hour >= 22 || context.hour < 6) {
      insights.push({
        id: 'off-peak',
        icon: '\u{1F319}',
        title: 'Off-Peak Charging Window',
        description:
          'Electricity rates are lower now. Great time to charge — save up to 20% on charging costs.',
        type: 'positive',
        action: { label: 'Find Charger', screen: 'MapTab' },
        priority: 6,
        timestamp: now,
      });
    }

    if (context.hour >= 12 && context.hour <= 15) {
      insights.push({
        id: 'heat-warning',
        icon: '\u{1F321}\uFE0F',
        title: 'Peak Heat Hours',
        description:
          'Temperature is likely above 35\u00B0C. Fast charging in extreme heat can accelerate battery degradation. If possible, wait for cooler evening hours.',
        type: 'warning',
        priority: 7,
        timestamp: now,
      });
    }

    // Spending insight
    if (context.monthlySpend > 1000) {
      insights.push({
        id: 'spending-high',
        icon: '\u{1F4B0}',
        title: 'Monthly Spending Above Average',
        description: `You've spent ~${context.monthlySpend} EGP this month on charging. Switching to off-peak hours could save ~${Math.round(context.monthlySpend * 0.15)} EGP.`,
        type: 'tip',
        action: { label: 'Optimize Costs', screen: 'AITab' },
        priority: 4,
        timestamp: now,
      });
    }

    // Weekend trip suggestion
    if (context.isWeekend && context.estimatedBatteryPercent > 60) {
      insights.push({
        id: 'weekend-trip',
        icon: '\u{1F5FA}\uFE0F',
        title: 'Weekend Trip Ready',
        description: `You have ~${context.estimatedBatteryPercent}% charge — enough for a ${Math.round((context.estimatedBatteryPercent * context.rangeKm) / 100)} km trip. How about Ain Sokhna or Alexandria?`,
        type: 'positive',
        action: {
          label: 'Plan Trip',
          screen: 'VehicleTab',
          params: { screen: 'TripPlanner' },
        },
        priority: 3,
        timestamp: now,
      });
    }

    // Charging frequency
    if (context.avgChargesPerWeek > 4) {
      insights.push({
        id: 'frequent-charger',
        icon: '\u26A1',
        title: 'High Charging Frequency',
        description: `You charge ~${context.avgChargesPerWeek} times/week. Fewer, deeper charges (20\u219280%) are better for battery longevity than many small top-ups.`,
        type: 'tip',
        priority: 4,
        timestamp: now,
      });
    }

    // Generic positive
    insights.push({
      id: 'co2-savings',
      icon: '\u{1F33F}',
      title: 'Eco Impact',
      description: `By driving electric, you save ~${Math.round(context.totalChargesThisMonth * 8)} kg of CO2 emissions this month compared to a petrol car.`,
      type: 'positive',
      priority: 2,
      timestamp: now,
    });

    return insights.sort((a, b) => b.priority - a.priority);
  },

  /**
   * Smart booking suggestion
   */
  suggestBookingTime(
    context: UserContext,
    stationName: string,
  ): SmartBookingSuggestion {
    const optimalHour = context.hour >= 20 ? context.hour : 20; // suggest evening
    const isOffPeak = optimalHour >= 22 || optimalHour < 6;

    return {
      suggestedTime: `Today, ${optimalHour > 12 ? optimalHour - 12 : optimalHour}:00 ${optimalHour >= 12 ? 'PM' : 'AM'}`,
      reason: isOffPeak
        ? 'Off-peak rate — electricity is cheaper now'
        : `${stationName} is usually less busy at this time`,
      savings: isOffPeak ? '~18% savings vs peak hours' : undefined,
      conflictWarning:
        context.hour >= 22
          ? 'Late night — station may have limited access'
          : undefined,
    };
  },

  /**
   * Wallet intelligence
   */
  getWalletInsights(context: UserContext): WalletInsight {
    const rand = seededRandom(context.vehicleMake + 'wallet');
    const trendPercent = Math.round(-15 + rand() * 40); // -15% to +25%

    return {
      monthlyTrend:
        trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'stable',
      trendPercent: Math.abs(trendPercent),
      trendReason:
        trendPercent > 5
          ? 'More peak-hour charging this month'
          : trendPercent < -5
            ? 'Good off-peak charging habits!'
            : 'Consistent charging patterns',
      suggestedTopUp:
        Math.round((context.monthlySpend * 1.1) / 100) * 100, // round to nearest 100
      costOptimizationTip: context.prefersFastCharging
        ? 'Switching 2 fast charges/week to AC charging saves ~80 EGP/month'
        : 'Your AC charging habits are already cost-efficient',
      potentialMonthlySavings: Math.round(60 + rand() * 140),
    };
  },

  /**
   * Get AI notification count (unread insights)
   */
  getNotificationCount(context: UserContext): number {
    const insights = this.generateInsights(context);
    return insights.filter((i) => i.priority >= 5).length;
  },
};
