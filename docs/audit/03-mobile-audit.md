# 03 — Mobile App Audit

Scope: `apps/mobile`. Expo SDK 52, React Native 0.76.5, Expo Router with typed
routes, zustand stores, FlashList. Audited with the New Architecture enabled; it
was turned off in 1.14.2, because the audio player cannot load under it.

## Configuration

| Item | Value | Assessment |
|---|---|---|
| `version` | `1.14.5` | matches `APP_RELEASE.latestVersion` and `RELEASE_NOTES[0]` |
| `android.versionCode` | `4` | increments per build |
| `android.package` | `za.co.newzcrime.app` | stable |
| `newArchEnabled` | `false` | the player cannot load under the New Architecture |
| `userInterfaceStyle` | `automatic` | paired with the theme hook |
| ABI filter | `withAndroidBuildArchs` → `arm64-v8a` only | verified in the built APK; written to `app/build.gradle` too since 1.14.2 |
| `expo-notifications` plugin | present | no runtime scheduling code found |
| `icon` / `splash` | **absent** | see M1 |

## Navigation

- Root stack (`src/app/_layout.tsx`) declares a single header-less `Stack` and
  exports `ErrorBoundary`, so a render failure in any screen becomes a
  readable `ErrorScreen` with retry instead of a blank window.
- Tab bar (`src/app/tabs/_layout.tsx`): `Today`, `Search`, `Podcasts`,
  `Library`, plus `Discover` and `Settings` registered with `href: null`.
  Every file in `tabs/` is declared, so no route draws an undeclared tab.
- Entry redirect (`src/app/index.tsx`) sends the reader to the tab named by
  the persisted `startTab` setting, defaulting to Today.

### M2 — two Settings routes

`app/settings/Settings.tsx` (linked from `saved/SavedScreen.tsx`) and
`app/tabs/Settings.tsx` (hidden tab) both render the same screen. Not a
crash, but two URLs for one destination. The plan already on the table
(move settings to a top-right control) resolves it; recorded, not changed.

## State

| Store | Persistence | Notes |
|---|---|---|
| `settings.store.ts` | AsyncStorage | `saved`/`draft`/`changed`; **validates** on hydrate |
| `saved.store.ts` | AsyncStorage | bookmarks |
| `search.store.ts` | AsyncStorage | recent searches |
| `sources.store.ts` | memory | shared source list |
| `player.store.ts` | memory | playback state |
| `speech.store.ts` | memory | TTS state |

### M3 — settings validation (fixed this pass)

`settings.store.hydrate()` previously merged the stored JSON with
`withDefaults` which **cast** unrecognised values through. `colourMode` is
used to index `palettes` in `useTheme`, so an unknown value resolved to
`undefined` and `colour.background` threw on **every screen**.

Reproduced with a stub store: a stored `{"colourMode":"midnight"}` throws
`TypeError: Cannot read property 'background' of undefined` in `useTheme`.
Now each field is checked against the ids the UI can actually set
(`isOneOf`) and falls back to its default, `startTab` is migrated
(`discover` → `search`), and booleans are type-checked. Corrupt storage is
caught and defaults are used.

## Screens

| Screen | Body | Loading | Error | Empty |
|---|---|---|---|---|
| `home/HomeScreen` | Home | `ListSkeleton` | `ErrorState` + retry | `EmptyState` |
| `search/SearchScreen` | Search | skeleton | `ErrorState` | `EmptyState` |
| `podcasts/PodcastsScreen` | Podcasts | `ListSkeleton` | `ErrorState` | `EmptyState` + **inline playback reason** |
| `saved/SavedScreen` | Library | — | — | `EmptyState` |
| `discover/DiscoverScreen` | Discover | reads shared sources store | `ErrorState` | `EmptyState` |
| `detail/ItemDetail` | detail | — | `ErrorState` | — |
| `detail/SourceDetail` | detail | — | `ErrorState` | — |
| `player/Player` | playback | — | surfaces `usePlayer().error` | — |
| `settings/SettingsScreen` | settings | — | — | — |
| `auth/*` | **unwired by instruction** | — | — | — |

### M4 — podcast playback failure was invisible (fixed earlier, confirmed)

The data is healthy (`podcast_episode` rows all carry `audio_url`), and the
whole chain is correct: adapter reads the `<enclosure>`, repository persists
`audio_url`, `playerService` guards the native module, `_layout` registers
the playback service, `player.store` calls a real RNTP v4 API.

Playback is **impossible in Expo Go** (fixed native module set; it cannot
load `react-native-track-player`) — that is the `CAPABILITY_PLAY` message.
The fix was to stop the failure being silent: the Podcasts list now renders
the reason inline. Verified the module is compiled into the APK dex
(`TrackPlayerModule`, `react-native-track-player`).

## Performance

- Lists use `@shopify/flash-list` with explicit `estimatedItemSize`.
- Images via `expo-image` (caching + transitions) rather than `Image`.
- Detail screens use gradients scoped to the header, not the whole article.
- Feed is keyset-paginated; `loadMore` de-duplicates by id.
- `useAsync`/`useFeed`/`useSearch` guard state updates behind an `isActive`
  flag or a generation counter, so an unmounted screen cannot set state.

Recorded issue: `useFeed.loadMore` `.catch(() => undefined)` (see `02` Q2).

## Accessibility (partial)

- Feedback components carry `accessible` and labels.
- Touch targets are laid out via the shared `spacing` scale; not formally
  measured against the 44pt guideline in this pass.
- Text scaling follows the `textSize` setting through `useTextScale`.

## Verdict

The mobile app is structurally sound: typed routes, error boundary,
per-screen loading/error/empty states, guarded async, and validated
persistence. The open items are product/asset ones (M1 icon/splash, M2
duplicate Settings, R2 base URL), not correctness ones.
