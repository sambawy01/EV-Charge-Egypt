import { evDatabase, getModelsForMake, getVehicleSpec, getMakes } from '@/core/data/evDatabase';

describe('evDatabase', () => {
  it('has BYD', () => expect(evDatabase.some((m) => m.make === 'BYD')).toBe(true));
  it('has MG', () => expect(evDatabase.some((m) => m.make === 'MG')).toBe(true));
  it('has Tesla', () => expect(evDatabase.some((m) => m.make === 'Tesla')).toBe(true));
  it('has Hyundai', () => expect(evDatabase.some((m) => m.make === 'Hyundai')).toBe(true));
  it('has Kia', () => expect(evDatabase.some((m) => m.make === 'Kia')).toBe(true));

  it('returns models for make', () => {
    const models = getModelsForMake('BYD');
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty('model');
    expect(models[0]).toHaveProperty('batteryCapacityKwh');
  });

  it('returns spec for specific model', () => {
    const spec = getVehicleSpec('BYD', 'Atto 3');
    expect(spec?.batteryCapacityKwh).toBeGreaterThan(0);
    expect(spec?.connectorTypes).toContain('CCS');
  });

  it('getMakes returns unique makes', () => {
    const makes = getMakes();
    expect(makes.length).toBeGreaterThan(0);
    expect(makes).toContain('BYD');
    expect(makes).toContain('Tesla');
    // Should be unique
    const uniqueMakes = [...new Set(makes)];
    expect(uniqueMakes.length).toBe(makes.length);
  });

  it('returns undefined for unknown model', () => {
    const spec = getVehicleSpec('Unknown', 'Unknown Model');
    expect(spec).toBeUndefined();
  });
});
