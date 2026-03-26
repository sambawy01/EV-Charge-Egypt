import { aiService } from '@/core/services/aiService';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { message: 'The cheapest charger near Maadi is IKARUS at 0.04 EGP/kWh.' },
        error: null,
      }),
    },
  },
}));

jest.mock('@/core/config/featureFlags', () => ({
  featureFlags: { MOCK_PROVIDERS: false },
}));

describe('aiService', () => {
  it('sends chat message and gets response', async () => {
    const response = await aiService.chat('Where is the cheapest charger near Maadi?', 'u1');
    expect(response).toHaveProperty('message');
    expect(response.message).toContain('Maadi');
  });

  it('has route planning method', () => expect(aiService.planRoute).toBeDefined());
  it('has cost optimizer method', () => expect(aiService.optimizeCosts).toBeDefined());
  it('has availability prediction method', () =>
    expect(aiService.predictAvailability).toBeDefined());
  it('has battery health method', () => expect(aiService.analyzeBatteryHealth).toBeDefined());
});
