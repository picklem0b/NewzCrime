-- Up Migration
-- SAFLII court feeds are RSS, but their items carry no dates, descriptions or
-- guids, so they are normalised by an adapter of their own. That adapter is
-- selected by `sources.type`, which therefore needs a third value.
ALTER TABLE sources DROP CONSTRAINT sources_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_type_check
  CHECK (type IN ('rss', 'podcast_index', 'saflii'));

-- Down Migration
-- Court sources must go before the constraint can be narrowed again.
DELETE FROM sources WHERE type = 'saflii';
ALTER TABLE sources DROP CONSTRAINT sources_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_type_check
  CHECK (type IN ('rss', 'podcast_index'));
