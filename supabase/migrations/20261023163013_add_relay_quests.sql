
-- Relay quests: community members can "pick up" a quest that someone else started
-- A relay links a new participation to an original participation
CREATE TABLE IF NOT EXISTS relay_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid REFERENCES quests(id) NOT NULL,
  tree_id text NOT NULL,
  area_id text,
  started_by uuid REFERENCES users(id) NOT NULL,
  current_holder uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','expired')),
  relay_count int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS relay_legs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid REFERENCES relay_chains(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  leg_order int NOT NULL DEFAULT 1,
  photo_url text,
  comment text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','skipped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

-- RLS
ALTER TABLE relay_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE relay_legs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relay_chains_read" ON relay_chains FOR SELECT USING (true);
CREATE POLICY "relay_chains_insert" ON relay_chains FOR INSERT WITH CHECK (true);
CREATE POLICY "relay_chains_update" ON relay_chains FOR UPDATE USING (true);

CREATE POLICY "relay_legs_read" ON relay_legs FOR SELECT USING (true);
CREATE POLICY "relay_legs_insert" ON relay_legs FOR INSERT WITH CHECK (true);
CREATE POLICY "relay_legs_update" ON relay_legs FOR UPDATE USING (true);

CREATE INDEX idx_relay_chains_area ON relay_chains(area_id);
CREATE INDEX idx_relay_chains_status ON relay_chains(status);
CREATE INDEX idx_relay_legs_chain ON relay_legs(chain_id);
;
