// Test-environment env vars. supabase.ts now throws if these are missing, so
// tests need stub values. Never use these against a real Supabase project.
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://test.supabase.invalid';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key-for-jest';
