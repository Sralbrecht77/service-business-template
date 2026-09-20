begin;

alter table public.bookings
  add column confirmed_at timestamptz,
  add column completed_at timestamptz,
  add column cancelled_at timestamptz;

comment on column public.bookings.confirmed_at is
  'First time this booking was marked confirmed.';
comment on column public.bookings.completed_at is
  'First time this booking was marked completed.';
comment on column public.bookings.cancelled_at is
  'First time this booking was marked cancelled.';

create or replace function public.set_booking_status_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'confirmed' and new.confirmed_at is null then
      new.confirmed_at := now();
    elsif new.status = 'completed' and new.completed_at is null then
      new.completed_at := now();
    elsif new.status = 'cancelled' and new.cancelled_at is null then
      new.cancelled_at := now();
    end if;
  end if;

  return new;
end;
$$;

create trigger set_booking_status_timestamp
  before update of status
  on public.bookings
  for each row
  execute function public.set_booking_status_timestamp();

revoke all on function public.set_booking_status_timestamp()
  from public, anon, authenticated;

-- Authorized admins can reschedule active bookings through the protected API.
-- Existing RLS policies and database conflict triggers remain authoritative.
grant update (requested_date, requested_time) on table public.bookings
  to authenticated;

create table public.booking_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  constraint booking_photos_original_name_length_check
    check (char_length(original_name) between 1 and 200),
  constraint booking_photos_mime_type_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint booking_photos_size_check
    check (size_bytes > 0 and size_bytes <= 5242880)
);

create index booking_photos_booking_id_idx
  on public.booking_photos (booking_id, created_at);

comment on table public.booking_photos is
  'Private metadata for customer-supplied booking photos stored in Supabase Storage.';

alter table public.booking_photos enable row level security;

revoke all on table public.booking_photos from anon, authenticated;
grant select on table public.booking_photos to authenticated;
grant select, insert, update, delete on table public.booking_photos to service_role;

create policy "Admins can read booking photo metadata"
  on public.booking_photos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

-- The bucket is private. Uploads, deletions, and signed URLs are handled only
-- by authenticated application routes using the server-only service client.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'booking-photos',
  'booking-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
