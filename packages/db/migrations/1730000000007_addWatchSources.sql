-- Up Migration
-- The Watch tab is a curated video shelf: live court coverage, commissions,
-- true-crime channels and provincial government updates, all from YouTube.
-- Videos are a content type of their own so they never leak into the article
-- feed, and sources carry a province and a category so the app can build
-- playlists without hard-coding channel ids.

ALTER TABLE sources DROP CONSTRAINT sources_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_type_check
  CHECK (type IN ('rss', 'podcast_index', 'saflii', 'youtube'));

ALTER TABLE sources DROP CONSTRAINT sources_content_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_content_type_check
  CHECK (content_type IN ('article', 'court_ruling', 'podcast_episode', 'video'));

ALTER TABLE content_items DROP CONSTRAINT content_items_type_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_type_check
  CHECK (type IN ('article', 'court_ruling', 'podcast_episode', 'video'));

ALTER TABLE sources
  ADD COLUMN province text
    CHECK (province IN (
      'gauteng', 'western_cape', 'kwazulu_natal', 'eastern_cape',
      'free_state', 'limpopo', 'mpumalanga', 'north_west', 'northern_cape'
    )),
  ADD COLUMN category text
    CHECK (category IN ('news', 'true_crime', 'courts', 'local'));

-- YouTube exposes view and like counts in the channel feed. They are nullable
-- because articles and podcast feeds do not carry them.
ALTER TABLE content_items
  ADD COLUMN view_count bigint,
  ADD COLUMN like_count integer;

-- Every channel below was checked against its public videos.xml feed before
-- being seeded. The set deliberately mixes national outlets with courtroom
-- channels and provincial government channels: a reader in Soweto, Durban or
-- Cape Town should see something happening near them, not only national news.
INSERT INTO sources
  (name, type, content_type, feed_url, site_url, description, is_active, province, category)
VALUES
  ('SABC News', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UC8yH-uI81UUtEMDsowQyx1g',
   'https://www.youtube.com/@SABCNews',
   'Public broadcaster. Breaking news, live briefings and court coverage.', true, NULL, 'news'),

  ('eNCA', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCI3RT5PGmdi1KVp9FG_CneA',
   'https://www.youtube.com/@eNCA',
   'Television news with live court and crime coverage.', true, NULL, 'news'),

  ('News24', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCO0akufu9MOzyz3nvGIXAAw',
   'https://www.youtube.com/@News24',
   'National news, investigations and live events.', true, NULL, 'news'),

  ('Newzroom Afrika', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCQMML3hAsx-Mz9j9ZN0tThQ',
   'https://www.youtube.com/@NewzroomAfrika',
   'Rolling news channel with long-form live coverage.', true, NULL, 'news'),

  ('Eyewitness News', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UC7CXDA7ZCU9Od6qzQr6phww',
   'https://www.youtube.com/@EWN',
   'Eyewitness News bulletins and live reports.', true, NULL, 'news'),

  ('Daily Maverick', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UC0CM9l-7mgfD78xkr_0x_-A',
   'https://www.youtube.com/@DailyMaverick',
   'Investigative journalism, interviews and live discussions.', true, NULL, 'news'),

  ('TimesLIVE Video', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCxPPgRYHH1NSp2Ya_ROiXxw',
   'https://www.youtube.com/@TimesLIVE',
   'TimesLIVE video reports and breaking news.', true, NULL, 'news'),

  ('The Citizen News', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UC6W8rnMBwnzioz-3-8jH0-w',
   'https://www.youtube.com/@TheCitizenNews',
   'National news with a strong courts and crime desk.', true, NULL, 'news'),

  ('True Crime South Africa', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCQt4kezVwqYH3wHSFfhv9rw',
   'https://www.youtube.com/@TrueCrimeSouthAfrica',
   'Solved and unsolved South African cases, told episode by episode.', true, NULL, 'true_crime'),

  ('MDNtv', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UClWk6DQBYHf6rLP8VtMn0Xw',
   'https://www.youtube.com/@MDNtv',
   'Live courtroom coverage and unedited proceedings from South African cases.', true, NULL, 'courts'),

  ('Bella Monsoon', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCM8a5owRvUZl-fXXl0QiWsw',
   'https://www.youtube.com/@BellaMonsoon',
   'Murder and Mayhem: South African true crime from a trauma-informed perspective.', true, NULL, 'true_crime'),

  ('South African Police Service', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCKgv0MBoPE7teuzcFn2FrNw',
   'https://www.youtube.com/@SAPoliceService',
   'Official SAPS briefings, wanted-person appeals and operations.', true, NULL, 'true_crime'),

  ('NPA TV', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCCalIsanUId6cwzyIgG0e1Q',
   'https://www.youtube.com/@NPA_TVchannel',
   'National Prosecuting Authority briefings and prosecution updates.', true, NULL, 'courts'),

  ('Judiciary RSA', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCoJRMoh7-g3_Q9MDAnvEA-w',
   'https://www.youtube.com/@JudiciaryRSA',
   'Official judiciary announcements, judgments and court information.', true, NULL, 'courts'),

  ('Parliament of South Africa', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UC-JR9Voq8LwxPCxKwqieRpQ',
   'https://www.youtube.com/@ParliamentofRSA',
   'Live sittings, committee hearings and commissions of inquiry.', true, NULL, 'courts'),

  ('Gauteng Provincial Government', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCGnfl5gdiUi1FklHGPEWKkA',
   'https://www.youtube.com/@gautengprovincialgovernment',
   'Gauteng service-delivery updates, briefings and live events.', true, 'gauteng', 'local'),

  ('City of Johannesburg', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCevX3M3T-1hLmqyzXcWL43w',
   'https://www.youtube.com/@CityOfJoburgZA',
   'Johannesburg metro announcements, council meetings and service updates.', true, 'gauteng', 'local'),

  ('Western Cape Government', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCTsD813oTTxAd68XH8NNukQ',
   'https://www.youtube.com/@westerncapegov',
   'Western Cape public information, briefings and provincial updates.', true, 'western_cape', 'local'),

  ('City of Cape Town', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UC6skQQ7uq-fyJj6cQlzOUjA',
   'https://www.youtube.com/@CityofCapeTown021',
   'Cape Town metro announcements, council meetings and service updates.', true, 'western_cape', 'local'),

  ('KZN Provincial Government', 'youtube', 'video',
   'https://www.youtube.com/feeds/videos.xml?channel_id=UCQyc9nxb1rvIO5nd2LIhQ-Q',
   'https://www.youtube.com/@kznonline',
   'KwaZulu-Natal provincial briefings and service-delivery updates.', true, 'kwazulu_natal', 'local')
ON CONFLICT (feed_url) DO NOTHING;

-- Down Migration
DELETE FROM sources WHERE type = 'youtube';

ALTER TABLE content_items
  DROP COLUMN view_count,
  DROP COLUMN like_count;

ALTER TABLE sources DROP COLUMN province;
ALTER TABLE sources DROP COLUMN category;

ALTER TABLE content_items DROP CONSTRAINT content_items_type_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_type_check
  CHECK (type IN ('article', 'court_ruling', 'podcast_episode'));

ALTER TABLE sources DROP CONSTRAINT sources_content_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_content_type_check
  CHECK (content_type IN ('article', 'court_ruling', 'podcast_episode'));

ALTER TABLE sources DROP CONSTRAINT sources_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_type_check
  CHECK (type IN ('rss', 'podcast_index', 'saflii'));
