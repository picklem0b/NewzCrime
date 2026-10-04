-- Up Migration
-- Podcast episodes carry their audio as an enclosure. Without it an episode can
-- be listed but not played. Nullable, because articles have no audio.
ALTER TABLE content_items ADD COLUMN audio_url text;

-- Down Migration
ALTER TABLE content_items DROP COLUMN audio_url;
