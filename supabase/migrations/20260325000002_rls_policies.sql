-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- user_profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- vehicles: users see own vehicles
CREATE POLICY "Users can view own vehicles" ON vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE USING (auth.uid() = user_id);

-- providers: public read
CREATE POLICY "Anyone can view providers" ON providers FOR SELECT USING (true);

-- stations: public read
CREATE POLICY "Anyone can view stations" ON stations FOR SELECT USING (true);

-- connectors: public read
CREATE POLICY "Anyone can view connectors" ON connectors FOR SELECT USING (true);

-- bookings: users see own bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- charging_sessions: users see own sessions
CREATE POLICY "Users can view own sessions" ON charging_sessions FOR SELECT USING (auth.uid() = user_id);

-- wallets: users see own wallet
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- transactions: users see own transactions via wallet
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT
  USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- reviews: public read, users can create own
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notifications: users see own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ads: public read
CREATE POLICY "Anyone can view active ads" ON ads FOR SELECT USING (is_active = true);

-- fleets: owner can manage
CREATE POLICY "Fleet owners can view fleet" ON fleets FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Fleet owners can update fleet" ON fleets FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can create fleets" ON fleets FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- fleet_members: fleet owner or member can view
CREATE POLICY "Fleet members can view membership" ON fleet_members FOR SELECT
  USING (auth.uid() = user_id OR fleet_id IN (SELECT id FROM fleets WHERE owner_id = auth.uid()));
