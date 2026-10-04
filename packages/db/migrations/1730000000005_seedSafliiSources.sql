-- Up Migration
-- Reported court judgments, straight from SAFLII: one feed per court.
--
-- These are the courts that hear criminal matters and the public-interest
-- litigation around them, plus the two apex courts. Every path below was
-- confirmed to exist on saflii.org; the code in the path is also the court's
-- neutral-citation code, e.g. `[2024] ZASCA 161`.
--
-- They are seeded ACTIVE. SAFLII sits behind a Cloudflare challenge that
-- datacentre addresses do not get past, so a host running from one will log
-- these as failed until it can reach them — that is what the per-source
-- partial-success tolerance is for, and it is preferred over shipping the
-- court-ruling feature switched off. Set `is_active = false` on this set if the
-- deployment host is blocked and the noise is not wanted.
INSERT INTO sources (name, type, content_type, feed_url, site_url, description, is_active)
VALUES
  ('Constitutional Court', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZACC',
   'https://www.saflii.org/za/cases/ZACC/',
   'Reported judgments of the Constitutional Court, via SAFLII.', true),

  ('Supreme Court of Appeal', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZASCA',
   'https://www.saflii.org/za/cases/ZASCA/',
   'Reported judgments of the Supreme Court of Appeal, via SAFLII.', true),

  ('Gauteng Division, Pretoria', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZAGPPHC',
   'https://www.saflii.org/za/cases/ZAGPPHC/',
   'Reported judgments of the Gauteng Division, Pretoria, via SAFLII.', true),

  ('Gauteng Local Division, Johannesburg', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZAGPJHC',
   'https://www.saflii.org/za/cases/ZAGPJHC/',
   'Reported judgments of the Gauteng Local Division, Johannesburg, via SAFLII.', true),

  ('Western Cape Division, Cape Town', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZAWCHC',
   'https://www.saflii.org/za/cases/ZAWCHC/',
   'Reported judgments of the Western Cape Division, Cape Town, via SAFLII.', true),

  ('KwaZulu-Natal Local Division, Durban', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZAKZDHC',
   'https://www.saflii.org/za/cases/ZAKZDHC/',
   'Reported judgments of the KwaZulu-Natal Local Division, Durban, via SAFLII.', true),

  ('KwaZulu-Natal Division, Pietermaritzburg', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZAKZPHC',
   'https://www.saflii.org/za/cases/ZAKZPHC/',
   'Reported judgments of the KwaZulu-Natal Division, Pietermaritzburg, via SAFLII.', true),

  ('Eastern Cape Division, Makhanda', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZAECGHC',
   'https://www.saflii.org/za/cases/ZAECGHC/',
   'Reported judgments of the Eastern Cape Division, Makhanda, via SAFLII.', true),

  ('Eastern Cape Local Division, Bhisho', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZAECBHC',
   'https://www.saflii.org/za/cases/ZAECBHC/',
   'Reported judgments of the Eastern Cape Local Division, Bhisho, via SAFLII.', true),

  ('Free State Division, Bloemfontein', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZAFSHC',
   'https://www.saflii.org/za/cases/ZAFSHC/',
   'Reported judgments of the Free State Division, Bloemfontein, via SAFLII.', true),

  ('Northern Cape Division, Kimberley', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZANCHC',
   'https://www.saflii.org/za/cases/ZANCHC/',
   'Reported judgments of the Northern Cape Division, Kimberley, via SAFLII.', true),

  ('Limpopo Division, Polokwane', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZALMPHC',
   'https://www.saflii.org/za/cases/ZALMPHC/',
   'Reported judgments of the Limpopo Division, Polokwane, via SAFLII.', true),

  ('North West Division, Mahikeng', 'saflii', 'court_ruling',
   'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZANWHC',
   'https://www.saflii.org/za/cases/ZANWHC/',
   'Reported judgments of the North West Division, Mahikeng, via SAFLII.', true)
ON CONFLICT (feed_url) DO NOTHING;

-- Down Migration
DELETE FROM sources WHERE type = 'saflii';
