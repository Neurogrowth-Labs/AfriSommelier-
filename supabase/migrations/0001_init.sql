-- AfriSommelier initial schema
--
-- Translated from firebase-blueprint.json + firestore.rules.
-- Firestore subcollections under /users/{userId}/... become flat tables
-- keyed on user_id (the Clerk user id, sourced from the JWT `sub` claim).
--
-- Auth comes from Clerk via a JWT template named "supabase" with claims
--   { "sub": "{{user.id}}", "email": "{{user.primary_email_address}}", "role": "authenticated" }
-- signed with the Supabase JWT secret. RLS policies below check
--   auth.jwt() ->> 'sub' = user_id
-- for ownership and a users.role = 'admin' override for admins.

create extension if not exists "pgcrypto";

-- =====================================================================
-- users
-- =====================================================================
create table if not exists public.users (
    user_id    text primary key,
    email      text,
    role       text not null default 'user',
    created_at timestamptz not null default now()
);

-- =====================================================================
-- taste_dna (one row per user; replaces /users/{uid}/profile/tasteDNA)
-- =====================================================================
create table if not exists public.taste_dna (
    user_id    text primary key references public.users(user_id) on delete cascade,
    profile    jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- =====================================================================
-- wishlist
-- =====================================================================
create table if not exists public.wishlist (
    id             uuid primary key default gen_random_uuid(),
    user_id        text not null references public.users(user_id) on delete cascade,
    name           text not null,
    vintage        text,
    region         text,
    grape          text,
    price          text,
    reason         text,
    notes          text,
    personal_notes text,
    image          text,
    image_url      text,
    added_at       timestamptz not null default now(),
    created_at     timestamptz not null default now()
);
create index if not exists wishlist_user_id_idx on public.wishlist (user_id);
create index if not exists wishlist_user_name_idx on public.wishlist (user_id, name);

-- =====================================================================
-- cellar
-- =====================================================================
create table if not exists public.cellar (
    id                 uuid primary key default gen_random_uuid(),
    user_id            text not null references public.users(user_id) on delete cascade,
    name               text not null,
    vintage            text,
    region             text,
    grape              text,
    status             text not null,
    status_color       text,
    image              text,
    rating             numeric,
    awards             text,
    abv                text,
    is_organic         boolean default false,
    calories_per_glass integer,
    price              text,
    notes              text,
    personal_notes     text,
    quantity           integer not null default 1,
    purchase_date      timestamptz,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);
create index if not exists cellar_user_id_idx on public.cellar (user_id);

-- =====================================================================
-- consumption (glass log)
-- =====================================================================
create table if not exists public.consumption (
    id             uuid primary key default gen_random_uuid(),
    user_id        text not null references public.users(user_id) on delete cascade,
    wine_id        uuid references public.cellar(id) on delete set null,
    wine_name      text not null,
    calories       integer,
    glass_size_ml  integer,
    rating         numeric,
    notes          text,
    occasion       text,
    date           timestamptz not null default now(),
    consumed_at    timestamptz,
    created_at     timestamptz not null default now()
);
create index if not exists consumption_user_id_idx on public.consumption (user_id);
create index if not exists consumption_user_date_idx on public.consumption (user_id, date);

-- =====================================================================
-- events
-- =====================================================================
create table if not exists public.events (
    id         uuid primary key default gen_random_uuid(),
    user_id    text not null references public.users(user_id) on delete cascade,
    title      text not null,
    date       text not null,
    time       text,
    location   text,
    notes      text,
    created_at timestamptz not null default now()
);
create index if not exists events_user_id_idx on public.events (user_id);

-- =====================================================================
-- Helper: clerk user id from the JWT
-- =====================================================================
create or replace function public.requesting_user_id() returns text
    language sql stable as $$
    select coalesce(auth.jwt() ->> 'sub', '')
$$;

-- Admin check: either a row in public.users with role = 'admin' or the email
-- matches the configurable app.admin_email Postgres setting.
create or replace function public.is_admin() returns boolean
    language plpgsql stable as $$
declare
    uid text := public.requesting_user_id();
    admin_email text := current_setting('app.admin_email', true);
    user_email text := auth.jwt() ->> 'email';
    role_match boolean;
begin
    if uid is null or uid = '' then
        return false;
    end if;
    select (role = 'admin') into role_match from public.users where user_id = uid;
    return coalesce(role_match, false)
        or (admin_email is not null and admin_email <> '' and admin_email = user_email);
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.users      enable row level security;
alter table public.taste_dna  enable row level security;
alter table public.wishlist   enable row level security;
alter table public.cellar     enable row level security;
alter table public.consumption enable row level security;
alter table public.events     enable row level security;

-- users: owners can read/insert/update themselves, admins can read/delete all
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
    for select using (public.requesting_user_id() = user_id or public.is_admin());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
    for insert with check (public.requesting_user_id() = user_id);

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
    for update using (public.requesting_user_id() = user_id or public.is_admin())
              with check (public.requesting_user_id() = user_id or public.is_admin());

drop policy if exists users_delete_admin on public.users;
create policy users_delete_admin on public.users
    for delete using (public.is_admin());

-- Generic owner-only policies for the rest of the tables
do $$
declare
    t text;
    sel_name text;
    ins_name text;
    upd_name text;
    del_name text;
begin
    foreach t in array array['taste_dna', 'wishlist', 'cellar', 'consumption', 'events']
    loop
        sel_name := t || '_select_owner';
        ins_name := t || '_insert_owner';
        upd_name := t || '_update_owner';
        del_name := t || '_delete_owner';

        execute format('drop policy if exists %I on public.%I;', sel_name, t);
        execute format('create policy %I on public.%I for select using (public.requesting_user_id() = user_id or public.is_admin());', sel_name, t);

        execute format('drop policy if exists %I on public.%I;', ins_name, t);
        execute format('create policy %I on public.%I for insert with check (public.requesting_user_id() = user_id);', ins_name, t);

        execute format('drop policy if exists %I on public.%I;', upd_name, t);
        execute format('create policy %I on public.%I for update using (public.requesting_user_id() = user_id) with check (public.requesting_user_id() = user_id);', upd_name, t);

        execute format('drop policy if exists %I on public.%I;', del_name, t);
        execute format('create policy %I on public.%I for delete using (public.requesting_user_id() = user_id or public.is_admin());', del_name, t);
    end loop;
end$$;

-- =====================================================================
-- Realtime
-- =====================================================================
alter publication supabase_realtime add table public.wishlist;
alter publication supabase_realtime add table public.cellar;
alter publication supabase_realtime add table public.consumption;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.taste_dna;
