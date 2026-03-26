-- Auto-create user_profiles on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, full_name, preferred_lang)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'ar'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create wallet for new users
CREATE OR REPLACE FUNCTION handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'EGP')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_user_profile_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_wallet();

-- Auto-confirm email (bypass email confirmation for development)
-- NOTE: In production, remove this trigger and enable email confirmation
CREATE OR REPLACE FUNCTION auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_confirm_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NULL)
  EXECUTE FUNCTION auto_confirm_email();
