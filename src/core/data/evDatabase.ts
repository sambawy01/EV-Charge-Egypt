export interface EVModel {
  make: string;
  model: string;
  year: number;
  batteryCapacityKwh: number;
  rangeKm: number;
  connectorTypes: string[];
  maxChargingKw: number;
}

export const evDatabase: EVModel[] = [
  // BYD (most popular EV brand in Egypt)
  {
    make: 'BYD',
    model: 'Atto 3',
    year: 2024,
    batteryCapacityKwh: 60.48,
    rangeKm: 420,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 80,
  },
  {
    make: 'BYD',
    model: 'Han EV',
    year: 2024,
    batteryCapacityKwh: 85.44,
    rangeKm: 521,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 120,
  },
  {
    make: 'BYD',
    model: 'Seal',
    year: 2024,
    batteryCapacityKwh: 82.56,
    rangeKm: 570,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },
  {
    make: 'BYD',
    model: 'Dolphin',
    year: 2024,
    batteryCapacityKwh: 44.9,
    rangeKm: 340,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 60,
  },
  {
    make: 'BYD',
    model: 'Tang EV',
    year: 2024,
    batteryCapacityKwh: 108.8,
    rangeKm: 530,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 110,
  },
  // MG
  {
    make: 'MG',
    model: 'MG4',
    year: 2024,
    batteryCapacityKwh: 64,
    rangeKm: 450,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 135,
  },
  {
    make: 'MG',
    model: 'MG5 EV',
    year: 2024,
    batteryCapacityKwh: 61.1,
    rangeKm: 400,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 87,
  },
  {
    make: 'MG',
    model: 'ZS EV',
    year: 2024,
    batteryCapacityKwh: 51,
    rangeKm: 320,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 76,
  },
  {
    make: 'MG',
    model: 'Marvel R',
    year: 2024,
    batteryCapacityKwh: 70,
    rangeKm: 402,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 92,
  },
  // Chery
  {
    make: 'Chery',
    model: 'Tiggo 8 Pro e+',
    year: 2024,
    batteryCapacityKwh: 19.3,
    rangeKm: 80,
    connectorTypes: ['Type2'],
    maxChargingKw: 6.6,
  },
  {
    make: 'Chery',
    model: 'eQ7',
    year: 2024,
    batteryCapacityKwh: 68.7,
    rangeKm: 412,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 80,
  },
  // BMW
  {
    make: 'BMW',
    model: 'iX3',
    year: 2024,
    batteryCapacityKwh: 80,
    rangeKm: 460,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },
  {
    make: 'BMW',
    model: 'iX',
    year: 2024,
    batteryCapacityKwh: 76.6,
    rangeKm: 425,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 195,
  },
  {
    make: 'BMW',
    model: 'i4',
    year: 2024,
    batteryCapacityKwh: 83.9,
    rangeKm: 590,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 205,
  },
  // Mercedes
  {
    make: 'Mercedes',
    model: 'EQC',
    year: 2024,
    batteryCapacityKwh: 80,
    rangeKm: 437,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 110,
  },
  {
    make: 'Mercedes',
    model: 'EQA',
    year: 2024,
    batteryCapacityKwh: 66.5,
    rangeKm: 426,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },
  {
    make: 'Mercedes',
    model: 'EQS',
    year: 2024,
    batteryCapacityKwh: 107.8,
    rangeKm: 770,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 200,
  },
  // Tesla
  {
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    batteryCapacityKwh: 60,
    rangeKm: 491,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'Tesla',
    model: 'Model Y',
    year: 2024,
    batteryCapacityKwh: 75,
    rangeKm: 533,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 250,
  },
  // Hyundai
  {
    make: 'Hyundai',
    model: 'Ioniq 5',
    year: 2024,
    batteryCapacityKwh: 77.4,
    rangeKm: 481,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 220,
  },
  {
    make: 'Hyundai',
    model: 'Kona Electric',
    year: 2024,
    batteryCapacityKwh: 65.4,
    rangeKm: 455,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 77,
  },
  // Kia
  {
    make: 'Kia',
    model: 'EV6',
    year: 2024,
    batteryCapacityKwh: 77.4,
    rangeKm: 528,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 233,
  },
  {
    make: 'Kia',
    model: 'Niro EV',
    year: 2024,
    batteryCapacityKwh: 64.8,
    rangeKm: 463,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 77,
  },
  // Nissan
  {
    make: 'Nissan',
    model: 'Leaf',
    year: 2024,
    batteryCapacityKwh: 40,
    rangeKm: 270,
    connectorTypes: ['CHAdeMO', 'Type2'],
    maxChargingKw: 50,
  },
  // JAC
  {
    make: 'JAC',
    model: 'E10X',
    year: 2024,
    batteryCapacityKwh: 30.2,
    rangeKm: 200,
    connectorTypes: ['Type2', 'GBT'],
    maxChargingKw: 30,
  },
  {
    make: 'JAC',
    model: 'iEV7S',
    year: 2024,
    batteryCapacityKwh: 39.2,
    rangeKm: 280,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 40,
  },
];

export function getMakes(): string[] {
  return [...new Set(evDatabase.map((v) => v.make))].sort();
}

export function getModelsForMake(make: string): EVModel[] {
  return evDatabase
    .filter((v) => v.make === make)
    .sort((a, b) => a.model.localeCompare(b.model));
}

export function getVehicleSpec(make: string, model: string): EVModel | undefined {
  return evDatabase.find((v) => v.make === make && v.model === model);
}
