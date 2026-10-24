ALTER TABLE community_events
ADD CONSTRAINT community_events_event_id_key
UNIQUE (event_id);
