import { evDatabase, EVModel } from '../data/evDatabase';

export interface BatteryHealthReport {
  healthScore: number; // 0-100
  estimatedDegradation: number; // percentage lost
  estimatedCycles: number;
  optimalChargeMin: number; // e.g. 20
  optimalChargeMax: number; // e.g. 80
  estimatedLifeYears: number;
  estimatedLifeKm: number;
  temperatureImpact: 'low' | 'moderate' | 'high';
  temperatureNote: string;
}

export interface ConsumptionReport {
  avgKwhPer100km: number;
  costPerKmEGP: number;
  monthlySpending: { month: string; amount: number }[];
  efficiencyVsSpec: number; // percentage, e.g. 92 means 92% of manufacturer spec
  totalKwhCharged: number;
  totalKmDriven: number;
  co2SavedKg: number;
}

export interface ChargingPatternsReport {
  preferredTime: string; // e.g. "Evening (6PM-10PM)"
  avgChargeDurationMin: number;
  topStations: { name: string; visits: number }[];
  dcVsAcRatio: { dc: number; ac: number }; // percentages
  avgChargesPerWeek: number;
  fastChargePercentage: number;
}

export interface AIInsight {
  icon: string;
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'positive';
}

export interface VehicleAnalysis {
  battery: BatteryHealthReport;
  consumption: ConsumptionReport;
  charging: ChargingPatternsReport;
  insights: AIInsight[];
  lastUpdated: string;
}

// Deterministic pseudo-random based on string seed
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return (h % 10000) / 10000;
  };
}

export const vehicleAnalysisService = {
  async analyzeVehicle(vehicle: {
    id: string;
    make: string;
    model: string;
    year?: number;
    battery_capacity_kwh: number;
  }): Promise<VehicleAnalysis> {
    // Find spec from database
    const spec = evDatabase.find(
      (ev) => ev.make.toLowerCase() === vehicle.make.toLowerCase() &&
              ev.model.toLowerCase() === vehicle.model.toLowerCase()
    );

    const rand = seededRandom(vehicle.id);
    const batteryKwh = vehicle.battery_capacity_kwh || spec?.batteryCapacityKwh || 60;
    const rangeKm = spec?.rangeKm || Math.round(batteryKwh * 6.5);
    const maxChargingKw = spec?.maxChargingKw || 50;
    const vehicleAge = vehicle.year ? (new Date().getFullYear() - vehicle.year) : 2;

    // Battery Health — degrade based on age + Egypt heat
    const baseDegradation = vehicleAge * (2 + rand() * 1.5); // 2-3.5% per year
    const heatPenalty = 1 + rand() * 0.8; // Egypt heat adds 0-0.8% extra
    const totalDegradation = Math.min(baseDegradation + heatPenalty, 30);
    const healthScore = Math.round(100 - totalDegradation);
    const estimatedCycles = Math.round(300 + vehicleAge * 150 + rand() * 100);

    const battery: BatteryHealthReport = {
      healthScore,
      estimatedDegradation: Math.round(totalDegradation * 10) / 10,
      estimatedCycles,
      optimalChargeMin: 20,
      optimalChargeMax: 80,
      estimatedLifeYears: Math.round((10 - vehicleAge) + rand() * 3),
      estimatedLifeKm: Math.round((250000 - vehicleAge * 25000) + rand() * 50000),
      temperatureImpact: totalDegradation > 10 ? 'high' : totalDegradation > 5 ? 'moderate' : 'low',
      temperatureNote: 'Egypt\'s average 35°C+ summers accelerate battery aging. Parking in shade and charging during cooler hours helps.',
    };

    // Consumption
    const specEfficiency = rangeKm > 0 ? (batteryKwh / rangeKm) * 100 : 16;
    const realEfficiency = specEfficiency * (1 + rand() * 0.15); // 0-15% worse than spec
    const efficiencyPercent = Math.round((specEfficiency / realEfficiency) * 100);
    const avgKwhPer100km = Math.round(realEfficiency * 10) / 10;
    const costPerKwh = 2.5 + rand() * 2; // 2.5-4.5 EGP/kWh in Egypt
    const costPerKm = Math.round((avgKwhPer100km / 100) * costPerKwh * 100) / 100;

    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthlySpending = months.map((month) => ({
      month,
      amount: Math.round(400 + rand() * 800),
    }));

    const totalKwhCharged = Math.round(estimatedCycles * batteryKwh * 0.6);
    const totalKmDriven = Math.round(totalKwhCharged / (avgKwhPer100km / 100));

    const consumption: ConsumptionReport = {
      avgKwhPer100km,
      costPerKmEGP: costPerKm,
      monthlySpending,
      efficiencyVsSpec: efficiencyPercent,
      totalKwhCharged,
      totalKmDriven,
      co2SavedKg: Math.round(totalKmDriven * 0.12), // vs ICE ~120g CO2/km
    };

    // Charging Patterns
    const timeSlots = ['Morning (6AM-10AM)', 'Midday (10AM-2PM)', 'Afternoon (2PM-6PM)', 'Evening (6PM-10PM)', 'Night (10PM-6AM)'];
    const preferredTimeIdx = Math.floor(rand() * timeSlots.length);

    const stationNames = [
      'Elsewedy Plug - City Stars', 'IKARUS New Cairo', 'Infinity EV - Mall of Egypt',
      'Sha7en - Police Academy', 'Revolta - Cairo Festival City', 'KarmCharge - Arkan Plaza',
    ];
    const topStations = stationNames
      .sort(() => rand() - 0.5)
      .slice(0, 3)
      .map((name, i) => ({ name, visits: Math.round(15 - i * 4 + rand() * 5) }));

    const dcPercent = Math.round(20 + rand() * 40);

    const charging: ChargingPatternsReport = {
      preferredTime: timeSlots[preferredTimeIdx],
      avgChargeDurationMin: Math.round(30 + rand() * 50),
      topStations,
      dcVsAcRatio: { dc: dcPercent, ac: 100 - dcPercent },
      avgChargesPerWeek: Math.round((2 + rand() * 3) * 10) / 10,
      fastChargePercentage: dcPercent,
    };

    // AI Insights
    const insights: AIInsight[] = [
      {
        icon: '🌡️',
        title: 'Heat Impact Detected',
        description: `Egypt's climate has contributed to ~${heatPenalty.toFixed(1)}% extra battery wear. Charging after 8 PM when temperatures drop can reduce this.`,
        type: 'warning',
      },
      {
        icon: '🔋',
        title: 'Optimal Charge Range',
        description: `Keeping your ${vehicle.make} ${vehicle.model} between 20-80% charge could extend battery life by approximately 2-3 years.`,
        type: 'tip',
      },
      {
        icon: '⚡',
        title: 'Charging Efficiency',
        description: `Your vehicle is running at ${efficiencyPercent}% of manufacturer spec efficiency. ${efficiencyPercent > 90 ? 'Excellent performance!' : 'Tire pressure and driving style may help improve this.'}`,
        type: efficiencyPercent > 90 ? 'positive' : 'tip',
      },
      {
        icon: '🌿',
        title: 'Environmental Impact',
        description: `You've saved approximately ${consumption.co2SavedKg.toLocaleString()} kg of CO2 compared to a petrol vehicle. That's equivalent to planting ${Math.round(consumption.co2SavedKg / 22)} trees!`,
        type: 'positive',
      },
      {
        icon: '📊',
        title: 'Next Charge Prediction',
        description: `Based on your driving patterns (~${Math.round(totalKmDriven / (estimatedCycles || 1))} km per charge), you'll likely need to charge again in ${Math.round(1 + rand() * 3)} days.`,
        type: 'tip',
      },
    ];

    return {
      battery,
      consumption,
      charging,
      insights,
      lastUpdated: new Date().toISOString(),
    };
  },
};
