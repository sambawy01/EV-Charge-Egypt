import { authService } from '@/core/auth/authService';

jest.mock('@/core/config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: '1' }, session: {} },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', role: 'driver' }, error: null }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', role: 'driver' }, error: null }),
        }),
      }),
    }),
  },
}));

describe('authService', () => {
  it('should have signUp method', () => expect(authService.signUp).toBeDefined());
  it('should have signIn method', () => expect(authService.signIn).toBeDefined());
  it('should have signOut method', () => expect(authService.signOut).toBeDefined());
});
