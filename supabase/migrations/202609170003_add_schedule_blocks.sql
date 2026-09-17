begin;

create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  blocked_date date not null,
  blocked_time time without time zone,
  note text,
  constraint schedule_blocks_note_length check (
    note is null or char_length(note) <= 500
  )
);

comment on table public.schedule_blocks is
  'Owner-created whole-day or start-time availability blocks.';
comment on column public.schedule_blocks.blocked_time is
  'Null blocks the entire date; a value blocks only that booking start time.';

create unique index schedule_blocks_unique_whole_date
  on public.schedule_blocks (blocked_date)
  where blocked_time is null;

create unique index schedule_blocks_unique_start_time
  on public.schedule_blocks (blocked_date, blocked_time)
  where blocked_time is not null;

create index schedule_blocks_upcoming
  on public.schedule_blocks (blocked_date, blocked_time);

alter table public.schedule_blocks enable row level security;

revoke all on table public.schedule_blocks from anon, authenticated;
grant select, insert, delete on table public.schedule_blocks to authenticated;
grant select, insert, update, delete on table public.schedule_blocks to service_role;

create policy "Admins can read schedule blocks"
  on public.schedule_blocks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "Admins can create schedule blocks"
  on public.schedule_blocks
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create policy "Admins can remove schedule blocks"
  on public.schedule_blocks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

-- All booking and block writes for the same date take the same advisory lock.
-- The triggers then provide an authoritative, race-safe conflict check even if
-- two requests arrive at nearly the same time.
create or replace function public.prevent_booking_on_blocked_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('pending', 'confirmed') then
    perform pg_advisory_xact_lock(
      hashtextextended('service-booking-date:' || new.requested_date::text, 0)
    );

    if exists (
      select 1
      from public.schedule_blocks
      where schedule_blocks.blocked_date = new.requested_date
        and (
          schedule_blocks.blocked_time is null
          or schedule_blocks.blocked_time = new.requested_time
        )
    ) then
      raise exception using
        errcode = '23P01',
        message = 'Requested booking slot is unavailable';
    end if;
  end if;

  return new;
end;
$$;

create trigger prevent_booking_on_blocked_slot
  before insert or update of requested_date, requested_time, status
  on public.bookings
  for each row
  execute function public.prevent_booking_on_blocked_slot();

create or replace function public.prevent_conflicting_schedule_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended('service-booking-date:' || new.blocked_date::text, 0)
  );

  if exists (
    select 1
    from public.schedule_blocks
    where schedule_blocks.blocked_date = new.blocked_date
      and schedule_blocks.id <> new.id
      and (
        new.blocked_time is null
        or schedule_blocks.blocked_time is null
        or schedule_blocks.blocked_time = new.blocked_time
      )
  ) then
    raise exception using
      errcode = '23P01',
      message = 'Schedule block overlaps an existing block';
  end if;

  return new;
end;
$$;

create trigger prevent_conflicting_schedule_block
  before insert or update of blocked_date, blocked_time
  on public.schedule_blocks
  for each row
  execute function public.prevent_conflicting_schedule_block();

revoke all on function public.prevent_booking_on_blocked_slot()
  from public, anon, authenticated;
revoke all on function public.prevent_conflicting_schedule_block()
  from public, anon, authenticated;

commit;
