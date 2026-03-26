import { creditService } from '@/core/services/creditService';

describe('creditService', () => {
  it('calculates bonus for 10000 EGP', () => {
    expect(creditService.calculateBonus(10000)).toBe(500);
  });

  it('calculates bonus for 25000 EGP', () => {
    expect(creditService.calculateBonus(25000)).toBe(1500);
  });

  it('calculates bonus for 50000 EGP', () => {
    expect(creditService.calculateBonus(50000)).toBe(4000);
  });

  it('calculates bonus for 100000 EGP', () => {
    expect(creditService.calculateBonus(100000)).toBe(12000);
  });

  it('no bonus for small amounts', () => {
    expect(creditService.calculateBonus(5000)).toBe(0);
  });

  it('returns bonus tiers', () => {
    const tiers = creditService.getBonusTiers();
    expect(tiers).toHaveLength(4);
    expect(tiers[0]).toMatchObject({ amount: 10000, bonus: 500, discount: '5%' });
    expect(tiers[3]).toMatchObject({ amount: 100000, bonus: 12000, discount: '12%' });
  });
});
