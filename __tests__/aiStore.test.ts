import { useAIStore } from '@/core/stores/aiStore';

describe('aiStore', () => {
  beforeEach(() => useAIStore.getState().reset());

  it('adds message to conversation', () => {
    useAIStore
      .getState()
      .addMessage({ role: 'user', content: 'Hello', timestamp: new Date().toISOString() });
    expect(useAIStore.getState().messages).toHaveLength(1);
  });

  it('clears conversation', () => {
    useAIStore
      .getState()
      .addMessage({ role: 'user', content: 'Hello', timestamp: new Date().toISOString() });
    useAIStore.getState().clearConversation();
    expect(useAIStore.getState().messages).toHaveLength(0);
  });

  it('sets typing state', () => {
    useAIStore.getState().setTyping(true);
    expect(useAIStore.getState().isTyping).toBe(true);
    useAIStore.getState().setTyping(false);
    expect(useAIStore.getState().isTyping).toBe(false);
  });

  it('stores last route', () => {
    const mockRoute = {
      stops: [],
      totalDistanceKm: 100,
      totalTimeMin: 60,
      totalChargeCost: 5,
      summary: 'Test route',
    };
    useAIStore.getState().setLastRoute(mockRoute);
    expect(useAIStore.getState().lastRoute).toEqual(mockRoute);
  });

  it('resets all state', () => {
    useAIStore
      .getState()
      .addMessage({ role: 'assistant', content: 'Hi', timestamp: new Date().toISOString() });
    useAIStore.getState().setTyping(true);
    useAIStore.getState().reset();
    expect(useAIStore.getState().messages).toHaveLength(0);
    expect(useAIStore.getState().isTyping).toBe(false);
    expect(useAIStore.getState().lastRoute).toBeNull();
  });
});
