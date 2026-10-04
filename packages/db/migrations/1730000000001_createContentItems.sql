-- Up Migration
-- pg_trgm supports the `ILIKE` fallback in search; the full-text index handles
-- word queries. Both are needed, because full-text does not match prefixes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('article', 'court_ruling', 'podcast_episode')),
  topic text
    CHECK (topic IN ('court', 'crime', 'politics', 'world')),
  external_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  excerpt text,
  image_url text,
  author text,
  published_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
  ) STORED,
  CONSTRAINT content_items_source_external_unique UNIQUE (source_id, external_id)
);

CREATE INDEX content_items_published_at_idx
  ON content_items (published_at DESC, id DESC);

CREATE INDEX content_items_source_published_idx
  ON content_items (source_id, published_at DESC, id DESC);

CREATE INDEX content_items_search_idx
  ON content_items USING gin (search_vector);

CREATE INDEX content_items_title_trgm_idx
  ON content_items USING gin (title gin_trgm_ops);

-- Down Migration
DROP TABLE content_items;
-- pg_trgm is left installed: dropping an extension another object may rely on
-- is destructive, and re-creating it is cheap.
