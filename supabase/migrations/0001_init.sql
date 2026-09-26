create extension if not exists "pgcrypto";

create table contracts (
  id            uuid primary key default gen_random_uuid(),
  brand         text not null,
  category      text default '',
  space         text default '',            -- rack or space ID, e.g. R3, W1, K1
  start_date    date,
  end_date      date not null,
  rent          integer default 0,          -- PKR per month
  terms         text default '',
  contact_name  text default '',
  phone         text default '',
  owner         text default 'Ali',         -- renewal decision owner
  renewal_status text not null default 'Not discussed'
    check (renewal_status in ('Not discussed','In talks','Renewing','Leaving')),
  notes         text default '',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table prospects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text default '',
  contact_name    text default '',
  phone           text default '',
  tags            text[] default '{}',      -- 'Shown interest', 'Given comments'
  status          text not null default 'Not contacted'
    check (status in ('Not contacted','No reply','Replied','Converted')),
  first_contacted date default current_date,
  join_date       date,                     -- date they asked to join
  space           text default '',          -- space they asked for
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table prospect_comments (
  id          uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  body        text not null,
  created_at  timestamptz default now()
);

create index on contracts (end_date);
create index on prospects (status);
create index on prospect_comments (prospect_id, created_at desc);

-- v1 runs behind a PIN gate with no per-user identity; RLS is disabled on
-- all three tables and the app uses the anon key directly. Revisited in
-- 09-auth-deploy.md. See README for this known limitation.
alter table contracts disable row level security;
alter table prospects disable row level security;
alter table prospect_comments disable row level security;
