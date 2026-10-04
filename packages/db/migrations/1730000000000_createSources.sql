-- Up Migration
CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'rss'
    CHECK (type IN ('rss', 'podcast_index')),
  content_type text NOT NULL DEFAULT 'article'
    CHECK (content_type IN ('article', 'court_ruling', 'podcast_episode')),
  feed_url text NOT NULL UNIQUE,
  site_url text,
  logo_url text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE sources;
