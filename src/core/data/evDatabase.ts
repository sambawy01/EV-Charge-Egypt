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
  // ─────────────────────────────────────────────
  // BYD
  // ─────────────────────────────────────────────
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
  {
    make: 'BYD',
    model: 'Seal U',
    year: 2024,
    batteryCapacityKwh: 71.8,
    rangeKm: 500,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 110,
  },
  {
    make: 'BYD',
    model: 'Song Plus EV',
    year: 2024,
    batteryCapacityKwh: 71.7,
    rangeKm: 505,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 110,
  },
  {
    make: 'BYD',
    model: 'Yuan Plus',
    year: 2024,
    batteryCapacityKwh: 60.48,
    rangeKm: 430,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 80,
  },
  {
    make: 'BYD',
    model: 'Qin Plus EV',
    year: 2024,
    batteryCapacityKwh: 57.1,
    rangeKm: 420,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 80,
  },
  {
    make: 'BYD',
    model: 'e2',
    year: 2024,
    batteryCapacityKwh: 43.2,
    rangeKm: 320,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 60,
  },
  {
    make: 'BYD',
    model: 'e6',
    year: 2024,
    batteryCapacityKwh: 71.7,
    rangeKm: 500,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 60,
  },

  // ─────────────────────────────────────────────
  // Tesla
  // ─────────────────────────────────────────────
  {
    make: 'Tesla',
    model: 'Model 3 Standard Range',
    year: 2024,
    batteryCapacityKwh: 60,
    rangeKm: 491,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2024,
    batteryCapacityKwh: 78.1,
    rangeKm: 629,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 250,
  },
  {
    make: 'Tesla',
    model: 'Model Y Standard Range',
    year: 2024,
    batteryCapacityKwh: 60,
    rangeKm: 455,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'Tesla',
    model: 'Model Y Long Range',
    year: 2024,
    batteryCapacityKwh: 78.1,
    rangeKm: 533,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 250,
  },
  {
    make: 'Tesla',
    model: 'Model S',
    year: 2024,
    batteryCapacityKwh: 100,
    rangeKm: 634,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 250,
  },
  {
    make: 'Tesla',
    model: 'Model X',
    year: 2024,
    batteryCapacityKwh: 100,
    rangeKm: 576,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 250,
  },
  {
    make: 'Tesla',
    model: 'Cybertruck',
    year: 2024,
    batteryCapacityKwh: 123,
    rangeKm: 547,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 250,
  },

  // ─────────────────────────────────────────────
  // BMW
  // ─────────────────────────────────────────────
  {
    make: 'BMW',
    model: 'i4',
    year: 2024,
    batteryCapacityKwh: 83.9,
    rangeKm: 590,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 205,
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
    model: 'iX1',
    year: 2024,
    batteryCapacityKwh: 64.7,
    rangeKm: 440,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 130,
  },
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
    model: 'i5',
    year: 2024,
    batteryCapacityKwh: 83.9,
    rangeKm: 582,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 205,
  },
  {
    make: 'BMW',
    model: 'i7',
    year: 2024,
    batteryCapacityKwh: 101.7,
    rangeKm: 625,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 195,
  },
  {
    make: 'BMW',
    model: 'iX2',
    year: 2024,
    batteryCapacityKwh: 64.7,
    rangeKm: 449,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 130,
  },

  // ─────────────────────────────────────────────
  // Mercedes
  // ─────────────────────────────────────────────
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
    model: 'EQB',
    year: 2024,
    batteryCapacityKwh: 66.5,
    rangeKm: 419,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },
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
    model: 'EQE',
    year: 2024,
    batteryCapacityKwh: 90.6,
    rangeKm: 654,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'Mercedes',
    model: 'EQE SUV',
    year: 2024,
    batteryCapacityKwh: 90.6,
    rangeKm: 590,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
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
  {
    make: 'Mercedes',
    model: 'EQS SUV',
    year: 2024,
    batteryCapacityKwh: 107.8,
    rangeKm: 660,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 200,
  },
  {
    make: 'Mercedes',
    model: 'EQV',
    year: 2024,
    batteryCapacityKwh: 90,
    rangeKm: 366,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 110,
  },

  // ─────────────────────────────────────────────
  // Audi
  // ─────────────────────────────────────────────
  {
    make: 'Audi',
    model: 'e-tron',
    year: 2024,
    batteryCapacityKwh: 95,
    rangeKm: 436,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },
  {
    make: 'Audi',
    model: 'e-tron GT',
    year: 2024,
    batteryCapacityKwh: 93.4,
    rangeKm: 488,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 270,
  },
  {
    make: 'Audi',
    model: 'Q4 e-tron',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 521,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 175,
  },
  {
    make: 'Audi',
    model: 'Q6 e-tron',
    year: 2025,
    batteryCapacityKwh: 100,
    rangeKm: 625,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 270,
  },
  {
    make: 'Audi',
    model: 'Q8 e-tron',
    year: 2024,
    batteryCapacityKwh: 114,
    rangeKm: 582,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },

  // ─────────────────────────────────────────────
  // Porsche
  // ─────────────────────────────────────────────
  {
    make: 'Porsche',
    model: 'Taycan',
    year: 2024,
    batteryCapacityKwh: 93.4,
    rangeKm: 507,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 270,
  },
  {
    make: 'Porsche',
    model: 'Taycan Cross Turismo',
    year: 2024,
    batteryCapacityKwh: 93.4,
    rangeKm: 490,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 270,
  },
  {
    make: 'Porsche',
    model: 'Macan Electric',
    year: 2025,
    batteryCapacityKwh: 100,
    rangeKm: 613,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 270,
  },

  // ─────────────────────────────────────────────
  // Volkswagen
  // ─────────────────────────────────────────────
  {
    make: 'Volkswagen',
    model: 'ID.3',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 549,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'Volkswagen',
    model: 'ID.4',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 521,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'Volkswagen',
    model: 'ID.5',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 530,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'Volkswagen',
    model: 'ID.7',
    year: 2024,
    batteryCapacityKwh: 86,
    rangeKm: 621,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'Volkswagen',
    model: 'ID.Buzz',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 423,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },

  // ─────────────────────────────────────────────
  // Hyundai
  // ─────────────────────────────────────────────
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
    model: 'Ioniq 6',
    year: 2024,
    batteryCapacityKwh: 77.4,
    rangeKm: 614,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 233,
  },
  {
    make: 'Hyundai',
    model: 'Kona Electric',
    year: 2024,
    batteryCapacityKwh: 65.4,
    rangeKm: 455,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 102,
  },
  {
    make: 'Hyundai',
    model: 'Ioniq 5 N',
    year: 2025,
    batteryCapacityKwh: 84,
    rangeKm: 448,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 350,
  },

  // ─────────────────────────────────────────────
  // Kia
  // ─────────────────────────────────────────────
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
    model: 'EV9',
    year: 2024,
    batteryCapacityKwh: 99.8,
    rangeKm: 541,
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
  {
    make: 'Kia',
    model: 'EV3',
    year: 2025,
    batteryCapacityKwh: 81.4,
    rangeKm: 600,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 128,
  },

  // ─────────────────────────────────────────────
  // Nissan
  // ─────────────────────────────────────────────
  {
    make: 'Nissan',
    model: 'Leaf',
    year: 2024,
    batteryCapacityKwh: 40,
    rangeKm: 270,
    connectorTypes: ['CHAdeMO', 'Type2'],
    maxChargingKw: 50,
  },
  {
    make: 'Nissan',
    model: 'Ariya',
    year: 2024,
    batteryCapacityKwh: 87,
    rangeKm: 533,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 130,
  },

  // ─────────────────────────────────────────────
  // Toyota
  // ─────────────────────────────────────────────
  {
    make: 'Toyota',
    model: 'bZ4X',
    year: 2024,
    batteryCapacityKwh: 71.4,
    rangeKm: 460,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },

  // ─────────────────────────────────────────────
  // Lexus
  // ─────────────────────────────────────────────
  {
    make: 'Lexus',
    model: 'RZ 450e',
    year: 2024,
    batteryCapacityKwh: 71.4,
    rangeKm: 440,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },

  // ─────────────────────────────────────────────
  // Volvo
  // ─────────────────────────────────────────────
  {
    make: 'Volvo',
    model: 'EX30',
    year: 2024,
    batteryCapacityKwh: 69,
    rangeKm: 476,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 153,
  },
  {
    make: 'Volvo',
    model: 'EX40',
    year: 2024,
    batteryCapacityKwh: 82,
    rangeKm: 476,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 200,
  },
  {
    make: 'Volvo',
    model: 'EX90',
    year: 2025,
    batteryCapacityKwh: 111,
    rangeKm: 600,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 250,
  },
  {
    make: 'Volvo',
    model: 'EC40',
    year: 2024,
    batteryCapacityKwh: 82,
    rangeKm: 487,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 200,
  },

  // ─────────────────────────────────────────────
  // Polestar
  // ─────────────────────────────────────────────
  {
    make: 'Polestar',
    model: 'Polestar 2',
    year: 2024,
    batteryCapacityKwh: 82,
    rangeKm: 551,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 205,
  },
  {
    make: 'Polestar',
    model: 'Polestar 3',
    year: 2025,
    batteryCapacityKwh: 111,
    rangeKm: 610,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 250,
  },
  {
    make: 'Polestar',
    model: 'Polestar 4',
    year: 2025,
    batteryCapacityKwh: 100,
    rangeKm: 590,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 200,
  },

  // ─────────────────────────────────────────────
  // Rivian
  // ─────────────────────────────────────────────
  {
    make: 'Rivian',
    model: 'R1T',
    year: 2024,
    batteryCapacityKwh: 135,
    rangeKm: 515,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 220,
  },
  {
    make: 'Rivian',
    model: 'R1S',
    year: 2024,
    batteryCapacityKwh: 135,
    rangeKm: 516,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 220,
  },
  {
    make: 'Rivian',
    model: 'R2',
    year: 2026,
    batteryCapacityKwh: 75,
    rangeKm: 483,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 300,
  },
  {
    make: 'Rivian',
    model: 'R3',
    year: 2026,
    batteryCapacityKwh: 70,
    rangeKm: 465,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 300,
  },

  // ─────────────────────────────────────────────
  // Lucid
  // ─────────────────────────────────────────────
  {
    make: 'Lucid',
    model: 'Air',
    year: 2024,
    batteryCapacityKwh: 112,
    rangeKm: 830,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 300,
  },
  {
    make: 'Lucid',
    model: 'Gravity',
    year: 2025,
    batteryCapacityKwh: 113,
    rangeKm: 708,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 300,
  },

  // ─────────────────────────────────────────────
  // Genesis
  // ─────────────────────────────────────────────
  {
    make: 'Genesis',
    model: 'GV60',
    year: 2024,
    batteryCapacityKwh: 77.4,
    rangeKm: 466,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 233,
  },
  {
    make: 'Genesis',
    model: 'GV70 Electrified',
    year: 2024,
    batteryCapacityKwh: 77.4,
    rangeKm: 455,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 233,
  },
  {
    make: 'Genesis',
    model: 'G80 Electrified',
    year: 2024,
    batteryCapacityKwh: 87.2,
    rangeKm: 520,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 187,
  },

  // ─────────────────────────────────────────────
  // Ford
  // ─────────────────────────────────────────────
  {
    make: 'Ford',
    model: 'Mustang Mach-E',
    year: 2024,
    batteryCapacityKwh: 91,
    rangeKm: 600,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },
  {
    make: 'Ford',
    model: 'F-150 Lightning',
    year: 2024,
    batteryCapacityKwh: 131,
    rangeKm: 515,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },

  // ─────────────────────────────────────────────
  // Chevrolet
  // ─────────────────────────────────────────────
  {
    make: 'Chevrolet',
    model: 'Equinox EV',
    year: 2025,
    batteryCapacityKwh: 85,
    rangeKm: 515,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },
  {
    make: 'Chevrolet',
    model: 'Blazer EV',
    year: 2024,
    batteryCapacityKwh: 102,
    rangeKm: 515,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 190,
  },
  {
    make: 'Chevrolet',
    model: 'Silverado EV',
    year: 2024,
    batteryCapacityKwh: 200,
    rangeKm: 724,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 350,
  },

  // ─────────────────────────────────────────────
  // GMC
  // ─────────────────────────────────────────────
  {
    make: 'GMC',
    model: 'Hummer EV SUV',
    year: 2024,
    batteryCapacityKwh: 200,
    rangeKm: 483,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 300,
  },
  {
    make: 'GMC',
    model: 'Hummer EV Pickup',
    year: 2024,
    batteryCapacityKwh: 200,
    rangeKm: 529,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 350,
  },

  // ─────────────────────────────────────────────
  // Jeep
  // ─────────────────────────────────────────────
  {
    make: 'Jeep',
    model: 'Avenger EV',
    year: 2024,
    batteryCapacityKwh: 54,
    rangeKm: 400,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },

  // ─────────────────────────────────────────────
  // Fiat
  // ─────────────────────────────────────────────
  {
    make: 'Fiat',
    model: '500e',
    year: 2024,
    batteryCapacityKwh: 42,
    rangeKm: 321,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 85,
  },

  // ─────────────────────────────────────────────
  // Mini
  // ─────────────────────────────────────────────
  {
    make: 'Mini',
    model: 'Cooper SE',
    year: 2024,
    batteryCapacityKwh: 54.2,
    rangeKm: 402,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 95,
  },
  {
    make: 'Mini',
    model: 'Countryman SE',
    year: 2025,
    batteryCapacityKwh: 66.5,
    rangeKm: 462,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 130,
  },

  // ─────────────────────────────────────────────
  // Peugeot
  // ─────────────────────────────────────────────
  {
    make: 'Peugeot',
    model: 'e-208',
    year: 2024,
    batteryCapacityKwh: 51,
    rangeKm: 400,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },
  {
    make: 'Peugeot',
    model: 'e-2008',
    year: 2024,
    batteryCapacityKwh: 54,
    rangeKm: 406,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },
  {
    make: 'Peugeot',
    model: 'e-308',
    year: 2024,
    batteryCapacityKwh: 54,
    rangeKm: 410,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },
  {
    make: 'Peugeot',
    model: 'e-3008',
    year: 2025,
    batteryCapacityKwh: 73,
    rangeKm: 527,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 160,
  },

  // ─────────────────────────────────────────────
  // Renault
  // ─────────────────────────────────────────────
  {
    make: 'Renault',
    model: 'Megane E-Tech',
    year: 2024,
    batteryCapacityKwh: 60,
    rangeKm: 450,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 130,
  },
  {
    make: 'Renault',
    model: 'Scenic E-Tech',
    year: 2024,
    batteryCapacityKwh: 87,
    rangeKm: 620,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },
  {
    make: 'Renault',
    model: 'Zoe',
    year: 2024,
    batteryCapacityKwh: 52,
    rangeKm: 395,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 50,
  },

  // ─────────────────────────────────────────────
  // Citroen
  // ─────────────────────────────────────────────
  {
    make: 'Citroen',
    model: 'e-C4',
    year: 2024,
    batteryCapacityKwh: 54,
    rangeKm: 420,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },
  {
    make: 'Citroen',
    model: 'e-C4 X',
    year: 2024,
    batteryCapacityKwh: 54,
    rangeKm: 420,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },

  // ─────────────────────────────────────────────
  // Opel/Vauxhall
  // ─────────────────────────────────────────────
  {
    make: 'Opel',
    model: 'Corsa Electric',
    year: 2024,
    batteryCapacityKwh: 51,
    rangeKm: 402,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },
  {
    make: 'Opel',
    model: 'Mokka Electric',
    year: 2024,
    batteryCapacityKwh: 54,
    rangeKm: 406,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 100,
  },

  // ─────────────────────────────────────────────
  // MG
  // ─────────────────────────────────────────────
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
  {
    make: 'MG',
    model: 'Cyberster',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 507,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 144,
  },
  {
    make: 'MG',
    model: 'MG3 Hybrid+',
    year: 2025,
    batteryCapacityKwh: 1.83,
    rangeKm: 50,
    connectorTypes: ['Type2'],
    maxChargingKw: 3.7,
  },

  // ─────────────────────────────────────────────
  // Chery
  // ─────────────────────────────────────────────
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
  {
    make: 'Chery',
    model: 'iCAR 03',
    year: 2024,
    batteryCapacityKwh: 66.9,
    rangeKm: 501,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 120,
  },
  {
    make: 'Chery',
    model: 'Omoda E5',
    year: 2025,
    batteryCapacityKwh: 61,
    rangeKm: 430,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 80,
  },

  // ─────────────────────────────────────────────
  // JAC
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // Xiaomi
  // ─────────────────────────────────────────────
  {
    make: 'Xiaomi',
    model: 'SU7',
    year: 2024,
    batteryCapacityKwh: 73.6,
    rangeKm: 668,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 210,
  },
  {
    make: 'Xiaomi',
    model: 'SU7 Pro',
    year: 2024,
    batteryCapacityKwh: 94.3,
    rangeKm: 830,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 210,
  },
  {
    make: 'Xiaomi',
    model: 'SU7 Max',
    year: 2024,
    batteryCapacityKwh: 101,
    rangeKm: 800,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 210,
  },

  // ─────────────────────────────────────────────
  // NIO
  // ─────────────────────────────────────────────
  {
    make: 'NIO',
    model: 'ET5',
    year: 2024,
    batteryCapacityKwh: 75,
    rangeKm: 560,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 140,
  },
  {
    make: 'NIO',
    model: 'ET7',
    year: 2024,
    batteryCapacityKwh: 100,
    rangeKm: 675,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 140,
  },
  {
    make: 'NIO',
    model: 'ES6',
    year: 2024,
    batteryCapacityKwh: 75,
    rangeKm: 490,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 140,
  },
  {
    make: 'NIO',
    model: 'ES8',
    year: 2024,
    batteryCapacityKwh: 100,
    rangeKm: 580,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 140,
  },
  {
    make: 'NIO',
    model: 'EC6',
    year: 2024,
    batteryCapacityKwh: 75,
    rangeKm: 495,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 140,
  },
  {
    make: 'NIO',
    model: 'EC7',
    year: 2024,
    batteryCapacityKwh: 100,
    rangeKm: 635,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 140,
  },

  // ─────────────────────────────────────────────
  // XPeng
  // ─────────────────────────────────────────────
  {
    make: 'XPeng',
    model: 'G6',
    year: 2024,
    batteryCapacityKwh: 87.5,
    rangeKm: 620,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 280,
  },
  {
    make: 'XPeng',
    model: 'G9',
    year: 2024,
    batteryCapacityKwh: 98,
    rangeKm: 650,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 300,
  },
  {
    make: 'XPeng',
    model: 'P7',
    year: 2024,
    batteryCapacityKwh: 86.2,
    rangeKm: 610,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 175,
  },
  {
    make: 'XPeng',
    model: 'X9',
    year: 2024,
    batteryCapacityKwh: 101.5,
    rangeKm: 610,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 300,
  },

  // ─────────────────────────────────────────────
  // Li Auto
  // ─────────────────────────────────────────────
  {
    make: 'Li Auto',
    model: 'MEGA',
    year: 2024,
    batteryCapacityKwh: 102.7,
    rangeKm: 710,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 520,
  },
  {
    make: 'Li Auto',
    model: 'L7',
    year: 2024,
    batteryCapacityKwh: 42.8,
    rangeKm: 210,
    connectorTypes: ['Type2', 'GBT'],
    maxChargingKw: 40,
  },
  {
    make: 'Li Auto',
    model: 'L8',
    year: 2024,
    batteryCapacityKwh: 42.8,
    rangeKm: 210,
    connectorTypes: ['Type2', 'GBT'],
    maxChargingKw: 40,
  },
  {
    make: 'Li Auto',
    model: 'L9',
    year: 2024,
    batteryCapacityKwh: 42.8,
    rangeKm: 215,
    connectorTypes: ['Type2', 'GBT'],
    maxChargingKw: 40,
  },

  // ─────────────────────────────────────────────
  // Geely
  // ─────────────────────────────────────────────
  {
    make: 'Geely',
    model: 'Geometry A',
    year: 2024,
    batteryCapacityKwh: 70,
    rangeKm: 500,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 60,
  },
  {
    make: 'Geely',
    model: 'Geometry C',
    year: 2024,
    batteryCapacityKwh: 70,
    rangeKm: 550,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 60,
  },

  // ─────────────────────────────────────────────
  // CUPRA
  // ─────────────────────────────────────────────
  {
    make: 'CUPRA',
    model: 'Born',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 548,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 170,
  },
  {
    make: 'CUPRA',
    model: 'Tavascan',
    year: 2025,
    batteryCapacityKwh: 77,
    rangeKm: 517,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 135,
  },

  // ─────────────────────────────────────────────
  // Skoda
  // ─────────────────────────────────────────────
  {
    make: 'Skoda',
    model: 'Enyaq iV',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 545,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 175,
  },
  {
    make: 'Skoda',
    model: 'Enyaq Coupe iV',
    year: 2024,
    batteryCapacityKwh: 77,
    rangeKm: 535,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 175,
  },

  // ─────────────────────────────────────────────
  // Zeekr
  // ─────────────────────────────────────────────
  {
    make: 'Zeekr',
    model: '001',
    year: 2024,
    batteryCapacityKwh: 100,
    rangeKm: 656,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 200,
  },
  {
    make: 'Zeekr',
    model: '007',
    year: 2024,
    batteryCapacityKwh: 100,
    rangeKm: 688,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 200,
  },
  {
    make: 'Zeekr',
    model: 'X',
    year: 2024,
    batteryCapacityKwh: 69,
    rangeKm: 440,
    connectorTypes: ['CCS', 'Type2', 'GBT'],
    maxChargingKw: 150,
  },

  // ─────────────────────────────────────────────
  // Smart
  // ─────────────────────────────────────────────
  {
    make: 'Smart',
    model: '#1',
    year: 2024,
    batteryCapacityKwh: 66,
    rangeKm: 440,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },
  {
    make: 'Smart',
    model: '#3',
    year: 2024,
    batteryCapacityKwh: 66,
    rangeKm: 455,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
  },

  // ─────────────────────────────────────────────
  // Lotus
  // ─────────────────────────────────────────────
  {
    make: 'Lotus',
    model: 'Eletre',
    year: 2024,
    batteryCapacityKwh: 112,
    rangeKm: 600,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 350,
  },
  {
    make: 'Lotus',
    model: 'Emeya',
    year: 2025,
    batteryCapacityKwh: 102,
    rangeKm: 610,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 350,
  },

  // ─────────────────────────────────────────────
  // Maserati
  // ─────────────────────────────────────────────
  {
    make: 'Maserati',
    model: 'GranTurismo Folgore',
    year: 2024,
    batteryCapacityKwh: 92.5,
    rangeKm: 450,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 270,
  },
  {
    make: 'Maserati',
    model: 'Grecale Folgore',
    year: 2024,
    batteryCapacityKwh: 105,
    rangeKm: 501,
    connectorTypes: ['CCS', 'Type2'],
    maxChargingKw: 150,
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
