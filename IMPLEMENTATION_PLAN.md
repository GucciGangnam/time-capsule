# Time Capsule — High-Level Implementation Plan

_Discovery session output. This is a v1 architectural plan, not final code._

## 1. Product summary

An augmented-reality app for pinning posts (text / photo / video) to a precise
real-world GPS location. Anyone physically within **30 m** of a pin sees it
floating in their camera view and can open it, read/watch it, and **like** it.
Use cases: a selfie at a summit, a review outside a restaurant, a story left in
a place.

Three "spaces" the user flicks between like the iOS-26 Camera app:
**My Posts ⟷ AR Camera (center, default) ⟷ Settings**. The swipe-between-modes
*interaction* mirrors the iOS-26 Camera; the **Liquid Glass material is deferred
to a v2 UI pass** (see §10). v1 uses a clean standard/translucent UI.

Posts are **permanent** — created once, never edited, and only removed when the
author deletes them. There is **no time mechanic**; "Time Capsule" is branding,
the feature set is purely spatial.

## 2. Decisions locked in this session

| Decision | Choice | Consequence |
|---|---|---|
| AR rendering | **Sensor-overlay AR** | Camera feed + pins placed by GPS distance & compass bearing math. Pure Expo, fast, cross-platform. Pins float roughly at location and jitter with the compass — needs smoothing + managed expectations. |
| Platform | **iOS + Android** | ~2x QA, but with Liquid Glass deferred the v1 UI is plain cross-platform styling (no OS-version branching). |
| UI material | **Standard/translucent v1; Liquid Glass in v2** | Deferred — dev has no iOS 26 to test it, and it's pure polish with no architectural impact. Build behind a `<Surface>` abstraction so v2 swaps it in cleanly. |
| Media in v1 | **Text + Photo + Video** | Adds in-app capture, compression/transcoding, larger storage/bandwidth, heavier moderation. |
| Auth | **Email + password** | Full flow: sign-up, email confirm, password reset, change password. |

## 3. Stack & hard constraints

- **Expo + React Native (TypeScript)** on a **custom dev client + EAS Build** —
  **not Expo Go** (camera, sensors, glass effect, media capture all need custom
  native modules).
- **Supabase**: Postgres + **PostGIS**, Auth (email+password), Storage (media),
  Row-Level Security, RPC for the geo query. No custom backend server needed for
  v1; Edge Functions only for moderation/cleanup hooks.
- Key libraries: `expo-router`, `expo-camera`, `expo-location`, `expo-sensors`,
  `expo-blur` (translucent surfaces; Liquid Glass / `expo-glass-effect` deferred
  to v2), `expo-image`,
  `expo-video` (playback), `expo-image-picker` / `expo-image-manipulator`
  (capture + compress), `react-native-reanimated` + `react-native-gesture-handler`
  (pager + pin animation), `@supabase/supabase-js`, `expo-secure-store`
  (session). _Push notifications are **out of v1**._

## 4. Data model (Postgres + PostGIS)

- **`profiles`** — `id uuid PK = auth.users.id`, `username citext UNIQUE`
  (≤12 chars, regex-validated), `created_at`. **Username is immutable** — set
  once at onboarding, never changeable. No profanity filter in v1.
- **`posts`** — `id`, `author_id → profiles`, `type` enum(`text`|`photo`|`video`)
  (derived from media, drives the pin icon), `body text` (nullable),
  `media_path text` (Storage key, null for text-only), `location
  geography(Point,4326)`, `like_count int DEFAULT 0` (denormalized, see below),
  `created_at`. A post carries **text and/or exactly one media item (1 photo OR
  1 video)** — `CHECK (body IS NOT NULL OR media_path IS NOT NULL)`. **No
  `updated_at`** (no edits, ever). **GiST index on `location`**; index on
  `like_count` for ordering.
- **`post_likes`** — `post_id`, `user_id`, `created_at`, `PK(post_id,user_id)`
  (unique prevents double-like). A trigger maintains `posts.like_count` so the
  radius query can order by popularity without a join/aggregate per fetch.
- **`reports`** / **`blocked_users`** — for trust & safety (§9).
- **RPC `posts_within_radius(lat, lng, radius_m DEFAULT 30, page_limit, cursor)`**
  → posts + author username + like_count + liked_by_me, using
  `ST_DWithin(location, ST_MakePoint(lng,lat)::geography, radius_m)`, excluding
  blocked users, **ordered by `like_count` DESC** and **paginated** (keyset on
  `(like_count, id)`). This is the single hot path.
- **RLS**: profiles world-readable / owner-writable; posts world-readable,
  insert where `author_id = auth.uid()`, delete by author only, **no update**;
  likes insert/delete by owner only.

## 5. Auth & onboarding

- Supabase email+password. Sign-up → email confirmation → **create profile +
  choose unique username** (≤12 chars, live availability check vs `profiles`,
  uniqueness enforced by DB index too).
- Session in `expo-secure-store`, auto-refresh. Password reset + change-password
  via deep link.

## 6. Navigation shell — the 3-pane swipe

- `expo-router` root. Authed home is a **horizontal pager** with 3 panes,
  AR Camera centered & default, mirroring iOS-26 Camera mode switching.
  Implement with `react-native-pager-view` or a Reanimated paged list, plus a
  `<Surface>` control strip with mode labels (translucent in v1, Liquid Glass in v2).
- Camera is mounted/active **only when its pane is focused** (battery + perf).

## 7. AR Camera screen (the core)

1. **Location gate** — on focus, request foreground location. If off/denied →
   full-screen blocking overlay (`<Surface>`) with a "Open Settings" button. AR is
   unusable without it.
2. **Camera** — `expo-camera` full-screen preview.
3. **Sensors** — `getCurrentPositionAsync` (high accuracy) +
   `watchPositionAsync({ distanceInterval: 10 })` (refetch when moved >10 m);
   `watchHeadingAsync` (compass); `expo-sensors` DeviceMotion (pitch for vertical
   placement / horizon).
4. **Fetch** — call `posts_within_radius(lat,lng,30)` on focus and on >10 m move;
   debounce; cache in state.
5. **Pin projection** — per post compute bearing + distance (haversine/bearing);
   `delta(postBearing, heading)` → X across the camera horizontal FOV (~60°);
   pitch → Y; distance → scale/opacity + distance label. Off-FOV pins become edge
   arrows. Low-pass filter heading & GPS to cut jitter.
6. **Pins** — absolutely-positioned Reanimated views with a type icon
   (text/photo/video). Tap → detail sheet (`<Surface>`): media, body, author
   username, distance, **like** button + count.
7. **Floating + button** — opens create-post; **locks exact current GPS at tap**;
   then refetch on save.
8. **Clustering** — stack/cluster pins when many sit at one spot (e.g. a busy
   restaurant) so they stay tappable.

## 8. Create-post flow

- A post = optional **text** plus **at most one** media item — either **1 photo**
  or **1 video** (never both).
- Photo via `expo-camera` capture or `expo-image-picker`, compressed with
  `expo-image-manipulator` to a reasonable size. Video **≤ 15 s**, length enforced
  at capture and re-validated on upload, with a sane size cap. Upload to Storage
  `post-media/{userId}/{uuid}`; store the returned path.
- Insert post row with the **captured location** (locked at +). No edit afterward.
- Client + server validation: at least one of text/media present; one-media rule;
  video duration ≤ 15 s.

## 9. My Posts / Settings / Likes / Trust & Safety

- **My Posts** — own posts newest-first (thumbnails, type, like count, date),
  **delete** (hard-delete row + Storage object, with confirm). No edit.
- **Settings** — email, username, sign out, change/reset password, delete account
  (cascade posts + media), location-permission status, legal, report/block entry.
- **Likes** — toggle = insert/delete in `post_likes`; optimistic UI.
- **Trust & safety (launch blocker for public UGC — Apple Guideline 1.2)** —
  report post, block user (filtered in the RPC), and a moderation path
  (flags table + optional on-upload image moderation via Edge Function).
  Strip EXIF on upload; consider fuzzing/clamping precision near homes.

## 10. UI material — `<Surface>` (Liquid Glass deferred to v2)

- All chrome (control strip, sheets, buttons, location-gate overlay) renders
  through one shared **`<Surface>`** component. In **v1** it's a clean
  translucent/blurred surface (`expo-blur` BlurView + standard styling),
  cross-platform with no OS-version branching.
- **v2 UI pass:** swap `<Surface>`'s internals for `expo-glass-effect` `GlassView`
  (with `isLiquidGlassAvailable()` check + BlurView fallback). Because every call
  site already goes through `<Surface>`, this is a single-component change — no
  rearchitecture. _Dev currently has no iOS 26 device to test Liquid Glass._

## 11. Native config & permissions

- iOS: `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`,
  `NSLocationWhenInUseUsageDescription`, `NSPhotoLibraryUsageDescription`.
- Android: `CAMERA`, `ACCESS_FINE_LOCATION`, `RECORD_AUDIO`, `READ_MEDIA_*`.
- Config plugins for expo-camera, expo-location (expo-glass-effect added in v2).
- Supabase URL + anon key via EAS secrets / `expo-constants`. **Never** ship the
  service-role key in the app.

## 12. Suggested structure

```
app/                 expo-router routes
components/           Glass, Pin, Sheet, ...
features/auth        sign-in/up, onboarding, username
features/ar          camera, projection, pins
features/posts       create, my-posts, detail, likes
lib/supabase         client + typed RPC
lib/geo              bearing / distance / FOV projection
supabase/            migrations, RPC SQL, RLS policies
```

## 13. Phased roadmap

- **P0** Init repo + push to GitHub; Expo scaffold (TS, expo-router, dev client);
  Supabase client + env; EAS setup.
- **P1** Auth (email+password) + profile/username onboarding + session.
- **P2** DB schema + PostGIS + RPC + RLS + Storage buckets/policies _(needs
  Supabase **write** access — currently MCP is read-only)._
- **P3** 3-pane swipe shell + `<Glass>` + Settings basics.
- **P4** AR camera: location gate, feed, fetch RPC, projection + pins, tap-to-open.
- **P5** Create post (text/photo/video → compress → upload → insert).
- **P6** My Posts (list + delete) + Likes.
- **P7** Trust & safety (report/block/moderation) + privacy hardening.
- **P8** Polish (jitter smoothing, perf, clustering), device testing, store assets,
  EAS Submit.

## 14. Key risks

- **AR accuracy/jitter** — GPS ±5–10 m + compass noise; mitigate with smoothing,
  distance labels, a calibration prompt; set expectations.
- **Battery** — camera + GPS + sensors are heavy; pause when pane unfocused.
- **Moderation** — public, geo-tagged UGC photos/video is a real T&S surface and
  an App Store / Play requirement before launch.
- **Pin density** — clustering needed at popular spots.

## 15. Resolved scope decisions

- **No time mechanic** — posts are permanent until the author deletes them.
- **No push notifications** in v1.
- **Media:** a post has optional text plus at most one media item — **1 photo or
  1 video (≤ 15 s)**, never both; reasonable size caps.
- **Username** is set once and **never changeable**; no profanity filter in v1.
- **Radius query is paginated**, ordered by **most-liked** (`like_count` DESC),
  fetching a reasonable page size.
