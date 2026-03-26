import { adService } from '@/core/services/adService';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'ad1', title: 'Starbucks', placement: 'charging_wait', advertiser_name: 'Starbucks Egypt', description: '10% off', image_url: null, action_url: null, target_area: null }],
              error: null,
            }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

jest.mock('@/core/config/featureFlags', () => ({
  featureFlags: { ADS_ENABLED: false },
}));

describe('adService', () => {
  it('fetches ads by placement (mock mode)', async () => {
    const ads = await adService.getAds('charging_wait');
    expect(ads.length).toBeGreaterThan(0);
    expect(ads[0]).toHaveProperty('title');
  });

  it('returns mock ads for charging_wait placement', async () => {
    const ads = await adService.getAds('charging_wait');
    expect(ads[0].placement).toBe('charging_wait');
  });

  it('returns empty array for digest placement', async () => {
    const ads = await adService.getAds('digest');
    expect(ads).toHaveLength(0);
  });

  it('tracks impression without throwing', async () => {
    await expect(adService.trackImpression('ad1')).resolves.not.toThrow();
  });

  it('tracks click without throwing', async () => {
    await expect(adService.trackClick('ad1')).resolves.not.toThrow();
  });
});
