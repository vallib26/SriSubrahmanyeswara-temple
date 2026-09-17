-- ============================================================
-- Sri Sri Sri Valli Devasena Sametha Subrahmanyeswara Swamy Temple
-- Supabase database schema
--
-- HOW TO USE:
-- 1. Create a free project at https://supabase.com
-- 2. Open your project's "SQL Editor" tab
-- 3. Paste this whole file in and click "Run"
-- 4. Then follow the "ADMIN USER SETUP" instructions at the bottom
-- ============================================================

-- ---------- Seva Bookings ----------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  seva text not null,
  name text not null,
  mobile text not null,
  seva_date date,
  gotra text,
  pilgrim_names text,
  notes text,
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;

-- Anyone (visitors) can submit a new booking
create policy "Anyone can insert a booking"
  on bookings for insert
  to anon
  with check (true);

-- Public direct SELECT is NOT allowed (blocks strangers browsing all bookings).
-- Devotees fetch their own bookings only via the get_my_bookings() function below.
-- Admins (logged in via Supabase Auth) can read everything, via the policy below.
create policy "Authenticated admin can read all bookings"
  on bookings for select
  to authenticated
  using (true);

create policy "Authenticated admin can update bookings"
  on bookings for update
  to authenticated
  using (true);

-- ---------- Donations ----------
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  amount numeric not null check (amount > 0),
  purpose text default 'General',
  created_at timestamptz not null default now()
);

alter table donations enable row level security;

create policy "Anyone can insert a donation"
  on donations for insert
  to anon
  with check (true);

create policy "Authenticated admin can read all donations"
  on donations for select
  to authenticated
  using (true);

-- ---------- Devotee self-service lookup functions ----------
-- These let a devotee see only THEIR OWN bookings/donations (matched by mobile
-- number) without being able to read anyone else's data, even though direct
-- table SELECT is blocked for the public "anon" role above.

create or replace function get_my_bookings(p_mobile text)
returns setof bookings
language sql
security definer
set search_path = public
as $$
  select * from bookings where mobile = p_mobile order by created_at desc;
$$;

create or replace function get_my_donations(p_mobile text)
returns setof donations
language sql
security definer
set search_path = public
as $$
  select * from donations where mobile = p_mobile order by created_at desc;
$$;

grant execute on function get_my_bookings(text) to anon;
grant execute on function get_my_donations(text) to anon;

create or replace function update_my_booking(
  p_id uuid, p_mobile text, p_gotra text, p_pilgrim_names text
)
returns setof bookings
language sql
security definer
set search_path = public
as $$
  update bookings
  set gotra = p_gotra, pilgrim_names = p_pilgrim_names
  where id = p_id and mobile = p_mobile
  returning *;
$$;

grant execute on function update_my_booking(uuid, text, text, text) to anon;

-- ============================================================
-- ADMIN USER SETUP (do this after running the SQL above)
-- ============================================================
-- 1. In your Supabase project, go to Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Enter an email and password for the temple admin (this becomes the
--    real admin login for the website's admin dashboard)
-- 4. Leave "Auto Confirm User" checked
-- 5. Save that email + password somewhere safe — you'll enter it in the
--    site's Admin Login instead of the old demo password
-- ============================================================
