# Design research

Sources: platform guidance and published descriptions of each product's design,
read in October 2026. Nothing here is copied; these are principles.

## Platform minimums

- Apple's Human Interface Guidelines set a 44 by 44 point minimum control size.
- Material guidance uses 48 dp. WCAG 2.2 AA requires 24 by 24 CSS px; AAA is 44.
- NewzCrime uses 44 as the floor for every control, including card actions.

## What each product contributes

| Product | Principle taken | Applied in NewzCrime |
|---|---|---|
| Apple News | Dated Today view, curated top stories, audio as its own destination | Dateline in the masthead, Top stories block, Podcasts as a tab |
| NYT | Today, Listen and a personal "You" area (saved, history) | Library holds saved items and the route to Settings |
| Guardian | Serif headlines with sans metadata; hierarchy by size, not boxes | Serif headline variants, sans kickers and metadata |
| BBC News | Kicker plus headline plus time; strict, repeated card anatomy | `StoryKicker` and `StoryMeta` shared by every row |
| Reuters | Information density and visible sourcing | Source name on every row, compact rows for older items |
| Google News | Topic chips that stay put while the feed scrolls | Sticky `TopicBar` |
| Linear | Calm interface, few colours, consistent components | One accent, hairline borders, no card shadows |
| Stripe | Strong hierarchy from type and spacing | One spacing scale, five text roles |
| Instagram, Reddit, YouTube | Bottom navigation within thumb reach, pull to refresh, persistent mini player | Four tabs, refresh that keeps content, mini player on every screen |

## Adopt

Serif headlines, a dated masthead, section rules instead of cards, a lead story
with a full-width image, unobtrusive save control, recents in search.

## Avoid

Cards with shadows on every item, glass effects, gradients, animation beyond
press and loading feedback, a tab for settings, invented "breaking" labels
without data to support them.

## Decision on typefaces

System serif (Georgia on iOS, Noto Serif on Android) for headlines and system
sans for interface text. No font download, no flash of unstyled text, nothing
added to the native build. A bundled serif is a later upgrade.
