
-- Add device_id for anonymous users
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);

-- Extend quests table with NPC data and district
ALTER TABLE quests ADD COLUMN IF NOT EXISTS area_id text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS npc_name text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS npc_dialogue text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS evidence_kind text DEFAULT 'whole_tree';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS demand_after timestamptz;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS satisfied boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_quests_tree_id ON quests(tree_id);
CREATE INDEX IF NOT EXISTS idx_quests_area_id ON quests(area_id);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active) WHERE is_active = true;

-- Add fields to participations
ALTER TABLE participations ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE participations ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Tree follows (favorites)
CREATE TABLE IF NOT EXISTS tree_follows (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tree_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tree_id)
);
ALTER TABLE tree_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own follows" ON tree_follows FOR ALL USING (true);

-- Planting proposals
CREATE TABLE IF NOT EXISTS planting_proposals (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  reason text,
  photo_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  area_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE planting_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view proposals" ON planting_proposals FOR SELECT USING (true);
CREATE POLICY "Users can create proposals" ON planting_proposals FOR INSERT WITH CHECK (true);

-- Community events (for timeline)
CREATE TABLE IF NOT EXISTS community_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('photo_submitted', 'quest_completed', 'tree_followed', 'proposal_created', 'milestone')),
  tree_id text,
  quest_id uuid REFERENCES quests(id) ON DELETE SET NULL,
  area_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON community_events FOR SELECT USING (true);
CREATE POLICY "System can insert events" ON community_events FOR INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_events_area ON community_events(area_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_recent ON community_events(created_at DESC);
;
