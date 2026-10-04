/**
 * Recorded SAFLII response.
 *
 * Captured verbatim from
 * `https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZACC` via the
 * Wayback Machine. It is kept as a fixture because SAFLII is behind a
 * Cloudflare challenge that datacentre addresses never get past, so there is no
 * way to run the adapter against the live feed from CI.
 *
 * Note the shape: an item has a title and a link and nothing else.
 */

export const SAFLII_ZACC_FEED = `<?xml version="1.0" encoding="UTF-8" ?>


<rss version="2.0">
\t<channel>
\t\t<title>Southern African Legal Information Institute - South Africa:  Constitutional Court - Latest decisions</title>
\t\t<link>http://www.saflii.org/</link>
\t\t<description>Free online access to law from Southern and Eastern Africa. Latest additions to the website.</description>
\t\t<image>
\t\t\t<title>SAFLII Web Site</title>
\t\t\t<url>/rss_feed/SAFLII_rss.jpg</url>
\t\t\t<link>http://www.saflii.org/</link>
\t\t\t<width>144</width>
\t\t\t<height>229</height>
\t\t</image>
<item>
<title>State Information Technology Agency SOC Limited v Gijima Holdings (Pty) Limited (CCT254/16) [2017] ZACC 40 (14 November 2017)</title>
<link>http://www.saflii.org/za/cases/ZACC/2017/40.html</link>
</item>
<item>
<title>Ferguson and Others v Rhodes University (CCT187/17) [2017] ZACC 39 (7 November 2017)</title>
<link>http://www.saflii.org/za/cases/ZACC/2017/39.html</link>
</item>
<item>
<title>Member of the Executive Council for Health and Social Development, Gauteng v DZ obo WZ (CCT20/17) [2017] ZACC 37 (31 October 2017)</title>
<link>http://www.saflii.org/za/cases/ZACC/2017/37.html</link>
</item>
<item>
<title>Harrielall v University of KwaZulu-Natal (CCT100/17) [2017] ZACC 38 (31 October 2017)</title>
<link>http://www.saflii.org/za/cases/ZACC/2017/38.html</link>
</item>
<item>
<title>Makhubela v S, Matjeke v S (CCT216/15, CCT221/16) [2017] ZACC 36 (29 September 2017)</title>
<link>http://www.saflii.org/za/cases/ZACC/2017/36.html</link>
</item>
<item>
<title>Matjhabeng Local Municipality v Eskom Holdings Limited and Others; Mkhonto and Others v Compensation Solutions (Pty) Limited (CCT 217/15; CCT 99/16) [2017] ZACC 35 (26 September 2017)</title>
<link>http://www.saflii.org/za/cases/ZACC/2017/35.html</link>
</item>
\t</channel>
</rss>
`;

/** An item with no date anywhere, which must be dropped rather than dated "now". */
export const SAFLII_FEED_WITH_UNDATED_ITEM = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
\t<channel>
\t\t<title>Test</title>
<item>
<title>Some unreported matter (1/2020)</title>
<link>http://www.saflii.org/za/cases/ZASCA/latest.html</link>
</item>
\t</channel>
</rss>
`;
