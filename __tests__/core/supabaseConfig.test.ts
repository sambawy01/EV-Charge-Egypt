import { supabase } from '@/core/config/supabase';

describe('Supabase client', () => {
  it('should export a valid client', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
  });
});
