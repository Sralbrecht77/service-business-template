create extension if not exists pgcrypto;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending',

  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,

  requested_date date not null,
  requested_time time without time zone not null,

  pickup_address text not null,
  destination_address text not null,

  crew_size smallint not null,
  estimated_hours numeric(4, 1) not null,
  round_trip_miles numeric(7, 1) not null,

  hourly_rate numeric(10, 2) not null,
  estimated_labor_cost numeric(10, 2) not null,
  travel_fee numeric(10, 2),
  estimated_base_total numeric(10, 2),

  has_piano boolean not null default false,
  has_gun_safe boolean not null default false,
  has_heavy_item boolean not null default false,
  has_excessive_stairs boolean not null default false,
  has_long_carry boolean not null default false,

  move_notes text,

  constraint bookings_status_check
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  constraint bookings_customer_name_length_check
    check (char_length(customer_name) between 2 and 120),
  constraint bookings_customer_email_check
    check (
      char_length(customer_email) <= 254
      and customer_email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    ),
  constraint bookings_customer_phone_length_check
    check (char_length(customer_phone) between 7 and 30),
  constraint bookings_address_length_check
    check (
      char_length(pickup_address) between 5 and 300
      and char_length(destination_address) between 5 and 300
    ),
  constraint bookings_crew_size_check check (crew_size between 2 and 50),
  constraint bookings_estimated_hours_check
    check (estimated_hours >= 2 and estimated_hours <= 24),
  constraint bookings_round_trip_miles_check check (round_trip_miles >= 0),
  constraint bookings_hourly_rate_check check (hourly_rate >= 0),
  constraint bookings_labor_cost_check check (estimated_labor_cost >= 0),
  constraint bookings_travel_fee_check check (travel_fee is null or travel_fee >= 0),
  constraint bookings_base_total_check
    check (
      (travel_fee is null and estimated_base_total is null)
      or (
        travel_fee is not null
        and estimated_base_total = estimated_labor_cost + travel_fee
      )
    ),
  constraint bookings_move_notes_length_check
    check (move_notes is null or char_length(move_notes) <= 2000)
);

comment on table public.bookings is
  'Private customer booking requests. Requests are pending until manually confirmed.';

create unique index bookings_one_active_request_per_slot_idx
  on public.bookings (requested_date, requested_time)
  where status in ('pending', 'confirmed');

create index bookings_requested_date_idx
  on public.bookings (requested_date);

create index bookings_status_idx
  on public.bookings (status);

alter table public.bookings enable row level security;

-- Customer data is never accessed directly from a browser. The Next.js route
-- uses the server-only Supabase secret key, which assumes service_role and
-- bypasses RLS. These revokes and explicit deny policies prevent direct access
-- through publishable-key clients for both anonymous and signed-in users.
revoke all on table public.bookings from anon, authenticated;
grant select, insert, update, delete on table public.bookings to service_role;

create policy "Deny anonymous booking access"
  on public.bookings
  for all
  to anon
  using (false)
  with check (false);

create policy "Deny authenticated booking access"
  on public.bookings
  for all
  to authenticated
  using (false)
  with check (false);
