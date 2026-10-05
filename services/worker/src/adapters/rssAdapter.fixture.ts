/**
 * Recorded feeds for the RSS adapter tests.
 *
 * Hand-written rather than captured, because the point is to pin the *shape*
 * of the real-world variance the adapter must absorb: RSS 2.0 and Atom, media
 * namespaces, and items that are missing a guid, a date, a title or a link.
 *
 * Every feed here is structurally valid XML. The adapter's job is to survive
 * the parts that are semantically incomplete.
 */

/** RSS 2.0, as news publishers emit it. */
export const RSS_NEWS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>NewzCrime Test Feed</title>
    <link>https://example.co.za</link>
    <description>A feed used only by tests.</description>
    <item>
      <title>Man arrested for hijacking in Soweto</title>
      <link>https://example.co.za/news/hijacking-soweto?utm_source=rss</link>
      <guid isPermaLink="false">news-hijack-001</guid>
      <pubDate>Mon, 02 Jan 2023 15:04:05 +0200</pubDate>
      <description><![CDATA[<p>Police said the <strong>suspect</strong> was found with an unlicensed firearm.</p>]]></description>
      <dc:creator>Thabo Mokoena</dc:creator>
      <media:content url="https://example.co.za/img/hijack.jpg" medium="image" />
    </item>
    <item>
      <title>Second story without a guid</title>
      <link>https://Example.co.za/News/Second-Story#comments</link>
      <description>No identifier anywhere, so the URL must be hashed.</description>
    </item>
    <item>
      <title>A story with no date at all</title>
      <link>https://example.co.za/news/no-date</link>
      <guid isPermaLink="false">news-nodate-003</guid>
    </item>
    <item>
      <link>https://example.co.za/news/no-title</link>
      <guid isPermaLink="false">news-notitle-004</guid>
    </item>
    <item>
      <title>A story with no link and no guid</title>
    </item>
  </channel>
</rss>
`;

/** Atom, as podcast hosts emit it. Audio lives in a `rel="enclosure"` link. */
export const ATOM_PODCAST_FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <title>Crime &amp; Consequence</title>
  <id>tag:pod.example,2023:show</id>
  <entry>
    <title>Episode 1: The Commission</title>
    <link rel="alternate" type="text/html" href="https://pod.example/ep1"/>
    <link rel="enclosure" type="audio/mpeg" href="https://pod.example/audio/ep1.mp3"/>
    <id>tag:pod.example,2023:1</id>
    <published>2023-03-05T10:00:00Z</published>
    <summary>We look at the evidence before the commission.</summary>
    <author><name>Naledi Dlamini</name></author>
  </entry>
  <entry>
    <title>Episode 2: The Ruling</title>
    <link rel="alternate" href="https://pod.example/ep2"/>
    <id>tag:pod.example,2023:2</id>
    <updated>2023-03-12T10:00:00Z</updated>
    <content type="html">&lt;p&gt;The court hands down judgment.&lt;/p&gt;</content>
    <media:thumbnail url="https://pod.example/ep2.jpg" />
  </entry>
</feed>
`;

/** A body that parses as XML but carries no feed. */
export const NOT_A_FEED = '<html><body>Cloudflare challenge</body></html>';
