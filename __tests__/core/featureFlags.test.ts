import { featureFlags } from '@/core/config/featureFlags';

describe('featureFlags', () => {
  it('has AI feature flag', () => expect(typeof featureFlags.AI_ASSISTANT).toBe('boolean'));
  it('has fleet feature flag', () => expect(typeof featureFlags.FLEET_MANAGEMENT).toBe('boolean'));
  it('has ads feature flag', () => expect(typeof featureFlags.ADS_ENABLED).toBe('boolean'));
});
