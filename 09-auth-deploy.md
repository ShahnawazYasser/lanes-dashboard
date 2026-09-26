# Chunk 9 — Access and deploy

## PIN gate
Four single-digit inputs, auto-advancing, with Backspace moving back. Wrong PIN clears the inputs and shows `That PIN isn't right. Try again.`

- The PIN lives in a server-side env var, **never** in client code. Verify through a route handler.
- On success, set an httpOnly cookie valid for 30 days.
- Gate every page and API route in `proxy.ts` (formerly `middleware.ts` — see `AGENTS.md`).
- Rate-limit failed attempts by IP: 10 per hour.

This is deliberately light. It stops a forwarded link from exposing rent figures and brand contacts; it is not real authentication.

### Implementation
- `lib/pin.ts` — PIN comparison against `DASHBOARD_PIN`, and the per-IP rate limiter.
- `app/api/login/route.ts` — verifies the PIN, sets the `lanes_pin` httpOnly cookie.
- `app/login/page.tsx` + `components/login/PinPad.tsx` — the four-box entry UI.
- `proxy.ts` — gates every route except `/login`, `/api/login`, and `/api/digest` (the cron route authenticates itself with `CRON_SECRET` and has no browser cookie to check).
- The rate limiter is an in-memory `Map`, not a database table: it resets on cold start and isn't shared across concurrent function instances. That's an accepted tradeoff for a low-traffic internal tool — see "Why not none at all" below.

## Why not none at all
The dashboard holds rent terms and brand contacts. On a naked link, one WhatsApp forward leaks it to a competing venue. The PIN is roughly thirty minutes of work.

## Path to real auth (v2)
Supabase Auth with magic links, RLS switched on, a `profiles` table, and roles for owner versus staff. Design the schema so this does not require a migration of the two main tables.

## Env vars
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DASHBOARD_PIN=
RESEND_API_KEY=
DIGEST_RECIPIENTS=
CRON_SECRET=
```

## Deploy
Vercel, with the cron entry in `vercel.json`:
```json
{ "crons": [{ "path": "/api/digest", "schedule": "0 4 * * *" }] }
```
Set `TZ=Asia/Karachi` on the project, and still compute dates explicitly in that zone rather than relying on it.

## Handover to Ali
- One page in the README: what the traffic light means, how to log a comment, how to import the Excel sheet
- Seed his real contracts first, then import his prospect sheet with him watching, so the mapping step is learned once
- Agree who owns data entry. A dashboard nobody updates is worse than the spreadsheet it replaced.
