
-- Users
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT USING (true);
CREATE POLICY "anon_insert_users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_users" ON users FOR UPDATE USING (true);

-- Quests
DROP POLICY IF EXISTS "Anyone can view active quests" ON quests;
CREATE POLICY "anon_select_quests" ON quests FOR SELECT USING (true);
CREATE POLICY "anon_insert_quests" ON quests FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_quests" ON quests FOR UPDATE USING (true);

-- Participations
DROP POLICY IF EXISTS "Users can view own participations" ON participations;
DROP POLICY IF EXISTS "Users can create participations" ON participations;
DROP POLICY IF EXISTS "Users can update own participations" ON participations;
CREATE POLICY "anon_select_participations" ON participations FOR SELECT USING (true);
CREATE POLICY "anon_insert_participations" ON participations FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_participations" ON participations FOR UPDATE USING (true);

-- Ledger
DROP POLICY IF EXISTS "Users can view own ledger" ON ledger;
CREATE POLICY "anon_select_ledger" ON ledger FOR SELECT USING (true);
CREATE POLICY "anon_insert_ledger" ON ledger FOR INSERT WITH CHECK (true);

-- Tree photos
DROP POLICY IF EXISTS "Anyone can view tree photos" ON tree_photos;
DROP POLICY IF EXISTS "Users can upload tree photos" ON tree_photos;
CREATE POLICY "anon_select_photos" ON tree_photos FOR SELECT USING (true);
CREATE POLICY "anon_insert_photos" ON tree_photos FOR INSERT WITH CHECK (true);
;
