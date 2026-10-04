-- Up Migration
-- Starter set of South African outlets, focused on court and crime reporting,
-- plus curated crime and true-life podcasts. Feed URLs were verified against
-- each publisher; the two marked inactive block this host, so they are seeded
-- switched off rather than left to fail on every run.

INSERT INTO sources (name, type, content_type, feed_url, site_url, description, is_active)
VALUES
  ('GroundUp', 'rss', 'article',
   'https://www.groundup.org.za/sitenews/rss/',
   'https://groundup.org.za',
   'Non-profit reporting on courts, crime and social justice.', true),

  ('Mail & Guardian', 'rss', 'article',
   'https://mg.co.za/rss',
   'https://mg.co.za',
   'Investigative and political reporting.', true),

  ('IOL', 'rss', 'article',
   'https://www.iol.co.za/rss',
   'https://www.iol.co.za',
   'General national news.', true),

  ('SABC News', 'rss', 'article',
   'https://www.sabcnews.com/sabcnews/feed/',
   'https://www.sabcnews.com',
   'Public broadcaster.', true),

  ('The Citizen', 'rss', 'article',
   'https://www.citizen.co.za/feed/',
   'https://www.citizen.co.za',
   'General national news.', true),

  ('eNCA', 'rss', 'article',
   'https://www.enca.com/rss.xml',
   'https://www.enca.com',
   'Television news with court and crime coverage.', true),

  ('TimesLIVE', 'rss', 'article',
   'https://www.timeslive.co.za/arc/outboundfeeds/rss/',
   'https://www.timeslive.co.za',
   'General national news.', true),

  ('SowetanLIVE', 'rss', 'article',
   'https://www.sowetanlive.co.za/arc/outboundfeeds/rss/',
   'https://www.sowetanlive.co.za',
   'General national news.', true),

  ('BusinessLIVE', 'rss', 'article',
   'https://www.businesslive.co.za/arc/outboundfeeds/rss/',
   'https://www.businesslive.co.za',
   'Business and political reporting.', true),

  ('The South African', 'rss', 'article',
   'https://www.thesouthafrican.com/feed/',
   'https://www.thesouthafrican.com',
   'General national news.', true),

  ('Daily Maverick', 'rss', 'article',
   'https://www.dailymaverick.co.za/feed/',
   'https://www.dailymaverick.co.za',
   'Investigative reporting. Feed refuses this host; enable when reachable.', false),

  ('News24', 'rss', 'article',
   'https://feeds.24.com/articles/news24/topstories/rss',
   'https://www.news24.com',
   'Paywalled; headline-level only. Enable when reachable.', false),

  ('True Crime South Africa', 'rss', 'podcast_episode',
   'https://rss.iono.fm/rss/chan/4652',
   'https://iono.fm',
   'South African true-crime cases.', true),

  ('Murder and Mayhem: South African True Crime', 'rss', 'podcast_episode',
   'https://feed.podbean.com/murderandmayhemsouthafricantruecrime/feed.xml',
   'https://podbean.com',
   'South African true-crime cases.', true),

  ('Unsolved Murders South Africa', 'rss', 'podcast_episode',
   'https://anchor.fm/s/1076e208c/podcast/rss',
   'https://anchor.fm',
   'Unsolved South African murder cases.', true),

  ('True Crime and Scams in South Africa', 'rss', 'podcast_episode',
   'https://rss.buzzsprout.com/2651897.rss',
   'https://buzzsprout.com',
   'True crime and fraud stories from South Africa.', true),

  ('Crime Central South Africa', 'rss', 'podcast_episode',
   'https://anchor.fm/s/e8019828/podcast/rss',
   'https://anchor.fm',
   'South African crime discussion.', true),

  ('True Crime Chronicles: South Africa', 'rss', 'podcast_episode',
   'https://anchor.fm/s/150b1a0c/podcast/rss',
   'https://anchor.fm',
   'South African true-crime cases.', true)
ON CONFLICT (feed_url) DO NOTHING;

-- Down Migration
DELETE FROM sources WHERE feed_url IN (
  'https://www.groundup.org.za/sitenews/rss/',
  'https://mg.co.za/rss',
  'https://www.iol.co.za/rss',
  'https://www.sabcnews.com/sabcnews/feed/',
  'https://www.citizen.co.za/feed/',
  'https://www.enca.com/rss.xml',
  'https://www.timeslive.co.za/arc/outboundfeeds/rss/',
  'https://www.sowetanlive.co.za/arc/outboundfeeds/rss/',
  'https://www.businesslive.co.za/arc/outboundfeeds/rss/',
  'https://www.thesouthafrican.com/feed/',
  'https://www.dailymaverick.co.za/feed/',
  'https://feeds.24.com/articles/news24/topstories/rss',
  'https://rss.iono.fm/rss/chan/4652',
  'https://feed.podbean.com/murderandmayhemsouthafricantruecrime/feed.xml',
  'https://anchor.fm/s/1076e208c/podcast/rss',
  'https://rss.buzzsprout.com/2651897.rss',
  'https://anchor.fm/s/e8019828/podcast/rss',
  'https://anchor.fm/s/150b1a0c/podcast/rss'
);
