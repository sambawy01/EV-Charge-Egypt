import { useAuthStore } from '@/core/stores/authStore';

describe('authStore', () => {
  beforeEach(() => useAuthStore.getState().reset());

  it('should start with no user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set user on login', () => {
    useAuthStore.getState().setUser({ id: '1', role: 'driver', full_name: 'Test' } as any);
    expect(useAuthStore.getState().user?.full_name).toBe('Test');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should clear user on logout', () => {
    useAuthStore.getState().setUser({ id: '1', role: 'driver', full_name: 'Test' } as any);
    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
