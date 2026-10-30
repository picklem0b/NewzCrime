-- Up Migration
-- Full article text is extracted from the publisher page on first open and
-- cached here, so the API reads the database rather than refetching the page
-- for every reader. `body_fetched_at` is set even when extraction fails: it
-- marks the attempt, so a paywalled or blocked page is not retried forever.
ALTER TABLE content_items ADD COLUMN body text;
ALTER TABLE content_items ADD COLUMN body_fetched_at timestamptz;

-- Down Migration
ALTER TABLE content_items DROP COLUMN body_fetched_at;
ALTER TABLE content_items DROP COLUMN body;
