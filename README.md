# Stride

Stride is a living running-shoe closet. The shoe is the character: it ages, reacts to runs, earns memories, changes mood, and eventually retires into a hall of fame.

## Core App

- `CLOSET`: living shoe cards, moods, life stages, memories, relationships, lineage, retirement ceremony, hall of fame, family tree.
- `RUN`: GPS run tracking, manual run logging, shoe picker, Strava sync/connect, Apple Watch and Garmin bridge access.
- `ADD`: quiz-powered shoe scouting using the local v10 scoring engine.

## Kept Plumbing

- Supabase auth and cloud sync.
- Local-first AsyncStorage persistence.
- Strava OAuth/import/export, via a server-side token proxy.
- Apple Watch through Apple Health.
- Garmin through the Strava bridge.
- GPS run tracking and route storage.
- Match quality and fatigue/wear models.

## Removed Product Surface

The old DRIFT, COACH, GAMES, MY SHOES, XP, achievements, runner levels, rosters, streaks, and runner-DNA surfaces have been removed from navigation and runtime flows. Runs now feed shoe life, memories, mood, and reactions instead of runner points.

## Environment

Copy `.env.example` to `.env` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRAVA_CLIENT_ID=
EXPO_PUBLIC_STRAVA_TOKEN_PROXY_URL=
```

Do not add private API keys or client secrets to `EXPO_PUBLIC_*`. Expo public values are shipped in the client bundle.

`EXPO_PUBLIC_STRAVA_TOKEN_PROXY_URL` should point to a backend or Supabase Edge Function that stores `STRAVA_CLIENT_SECRET` server-side and forwards token exchange/refresh requests to Strava.

An example Supabase Edge Function lives at `supabase/functions/strava-token/index.ts`.

## Development

```bash
npm install
npm run lint
npx expo start
```
