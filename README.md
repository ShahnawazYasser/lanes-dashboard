# Lanes Dashboard

Internal dashboard for Lanes (a multi-brand retail venue in Lahore), replacing an
Excel sheet for tracking brand contracts and prospective tenants.

## Stack

Next.js (App Router, TypeScript), Supabase (Postgres), Tailwind CSS, deployed on Vercel.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be asked for the PIN set in
`DASHBOARD_PIN` — see `09-auth-deploy.md`.

## Database

Schema lives in `supabase/migrations/0001_init.sql`, demo data in `supabase/seed.sql`.
Apply both against your Supabase project (SQL editor, or the Supabase CLI):

```bash
supabase db push          # applies migrations
psql "$DATABASE_URL" -f supabase/seed.sql
```

### Known v1 limitation: RLS is disabled

The app runs behind a PIN gate (see `09-auth-deploy.md`) with no per-user identity,
and talks to Supabase with the anon key. Row Level Security is intentionally
**disabled** on `contracts`, `prospects`, and `prospect_comments` for v1 — there is
no per-request identity for policies to key off yet. This means the anon key has
full read/write access to these tables; keep it out of anything public beyond this
app. Revisit this once auth is added.

## Daily digest email

`app/api/digest/route.ts` sends the daily alert email via [Resend](https://resend.com),
triggered by the Vercel Cron job in `vercel.json` (9:00 AM Asia/Karachi). The bell in
the top bar (`components/shell/AlertBell.tsx`) previews the exact same content by
calling the same `lib/digest.ts` / `lib/digestEmail.ts` functions the route uses, so
the badge count, the preview modal, and the sent email always agree.

Env vars, in addition to the Supabase ones above:

- `CRON_SECRET` — bearer token Vercel Cron sends; the route rejects any other caller.
- `RESEND_API_KEY` — Resend API key.
- `DIGEST_RECIPIENTS` — comma-separated recipient list. Leave empty to disable sending.
- `DIGEST_FROM` — optional sender override (defaults to `Lanes <digest@resend.dev>`).

To trigger it manually in dev: `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/digest`.

## Handover to Ali

- **The PIN.** The dashboard is behind a 4-digit PIN — it's the only thing standing
  between the link and rent/contact info, so don't forward it outside the team.
  Ask Shahnawaz for the current PIN if you don't have it; once entered, it's
  remembered on that device for 30 days, so you shouldn't need to re-enter it often.
  See `09-auth-deploy.md` for why this is a PIN and not full login.
- **The traffic light.** Green means the contract has 8+ weeks left. Amber ("needs
  attention soon") means 4–7 weeks left. Red ("needs attention now") means under 4
  weeks left or already ended. It's driven entirely by the end date on the contract —
  update that date and the light updates itself.
- **Logging a comment.** Open a prospect, type into "Log a comment" at the bottom of
  the drawer, and hit Log comment. It's timestamped and stays on that prospect's
  record for anyone who opens it later — this is how the whole team stays in sync on
  where a conversation with a brand stands, instead of it living in someone's head or
  a WhatsApp thread.
- **Importing the Excel sheet.** From the Import tab, drop your `.xlsx`/`.xls`/`.csv`
  file, choose whether it's contracts or prospects, then match each field to a column
  from your file (the app guesses this for you first). Preview the rows before
  confirming — nothing is written until you approve that screen.

## Testing

```bash
npm run test
```

Unit tests cover `lib/contracts.ts` (traffic light boundaries), `lib/prospects.ts`
(last-contact / days-since logic), and `lib/digest.ts` (alert bucketing, the 30-day
join window, and the gone-quiet top-5).
