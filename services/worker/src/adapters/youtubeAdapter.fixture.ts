/** A trimmed YouTube channel feed, shaped exactly like videos.xml. */
export const YOUTUBE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <id>yt:channel:lWk6DQBYHf6rLP8VtMn0Xw</id>
  <yt:channelId>lWk6DQBYHf6rLP8VtMn0Xw</yt:channelId>
  <title>MDNtv</title>
  <link rel="alternate" href="https://www.youtube.com/channel/UClWk6DQBYHf6rLP8VtMn0Xw"/>
  <author>
    <name>MDNtv</name>
    <uri>https://www.youtube.com/channel/UClWk6DQBYHf6rLP8VtMn0Xw</uri>
  </author>
  <published>2017-11-07T11:28:03+00:00</published>
  <entry>
    <id>yt:video:k4lBt2AhgIs</id>
    <yt:videoId>k4lBt2AhgIs</yt:videoId>
    <title>🔴 LIVE | COURT CASE &amp; FRAUD | 29 OCT 2026</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=k4lBt2AhgIs"/>
    <author>
      <name>MDNtv</name>
      <uri>https://www.youtube.com/channel/UClWk6DQBYHf6rLP8VtMn0Xw</uri>
    </author>
    <published>2026-10-29T21:59:33+00:00</published>
    <updated>2026-10-29T22:16:27+00:00</updated>
    <media:group>
      <media:title>Live court case</media:title>
      <media:content url="https://www.youtube.com/v/k4lBt2AhgIs?version=3" type="application/x-shockwave-flash" width="640" height="390"/>
      <media:thumbnail url="https://i4.ytimg.com/vi/k4lBt2AhgIs/hqdefault.jpg" width="480" height="360"/>
      <media:description>WATCH LIVE: The case continues.

All accused are presumed innocent.

Links:
https://example.com/live</media:description>
      <media:community>
        <media:starRating count="712" average="4.5" min="1" max="5"/>
        <media:statistics views="18432"/>
      </media:community>
    </media:group>
  </entry>
  <entry>
    <id>yt:video:abcdefghijk</id>
    <yt:videoId>abcdefghijk</yt:videoId>
    <title>No media block</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abcdefghijk"/>
    <author><name>MDNtv</name></author>
    <published>2026-10-28T10:00:00+00:00</published>
  </entry>
  <entry>
    <title>Missing video id</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=zzzzzzzzzzz"/>
    <published>2026-10-27T10:00:00+00:00</published>
  </entry>
</feed>`;

export const NOT_A_YOUTUBE_FEED = `<rss><channel><title>Not this</title></channel></rss>`;
