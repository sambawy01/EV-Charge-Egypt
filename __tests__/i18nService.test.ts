import { i18n, t } from '@/core/services/i18nService';

// Mock react-native I18nManager for test env
jest.mock('react-native', () => ({
  I18nManager: {
    forceRTL: jest.fn(),
    allowRTL: jest.fn(),
    isRTL: false,
  },
  Platform: { OS: 'ios' },
}));

describe('i18nService', () => {
  afterEach(() => {
    i18n.setLocale('en');
  });

  it('returns English strings by default', () => {
    expect(t('app_name')).toBe('WattsOn');
  });

  it('translates common keys in English', () => {
    expect(t('sign_in')).toBe('Sign In');
    expect(t('book_now')).toBe('Book Now');
    expect(t('wallet')).toBe('Wallet');
  });

  it('switches to Arabic', () => {
    i18n.setLocale('ar');
    expect(t('app_name')).toBe('شحن مصر');
  });

  it('reports isRTL correctly', () => {
    i18n.setLocale('ar');
    expect(i18n.isRTL()).toBe(true);
    i18n.setLocale('en');
    expect(i18n.isRTL()).toBe(false);
  });

  it('gets current locale', () => {
    expect(i18n.getLocale()).toBe('en');
    i18n.setLocale('ar');
    expect(i18n.getLocale()).toBe('ar');
  });
});
