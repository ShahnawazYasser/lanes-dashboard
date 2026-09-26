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

Open [http://localhost:3000](http://localhost:3000).

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

## Testing

```bash
npm run test
```

Unit tests cover `lib/contracts.ts` (traffic light boundaries) and
`lib/prospects.ts` (last-contact / days-since logic).
