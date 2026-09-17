begin;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Allowlist of Supabase Auth users authorized to access the private admin area.';

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

create policy "Admins can read their own membership"
  on public.admin_users
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Keep bookings completely unavailable to anonymous visitors. Authenticated
-- users receive narrowly scoped grants, and RLS admits only allowlisted admins.
drop policy if exists "Deny authenticated booking access" on public.bookings;

grant select on table public.bookings to authenticated;
grant update (status) on table public.bookings to authenticated;

create policy "Admins can read bookings"
  on public.bookings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "Admins can update booking status"
  on public.bookings
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

commit;
