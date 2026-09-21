begin;

alter table public.bookings
  add column deposit_percentage numeric(5, 4) not null default 0.20,
  add column deposit_amount_cents integer,
  add column payment_status text not null default 'unpaid',
  add column stripe_checkout_session_id text,
  add column stripe_payment_intent_id text,
  add column deposit_paid_at timestamptz;

alter table public.bookings
  add constraint bookings_deposit_percentage_check
    check (deposit_percentage = 0.20),
  add constraint bookings_deposit_amount_check
    check (
      deposit_amount_cents is null
      or (
        deposit_amount_cents > 0
        and estimated_base_total is not null
        and deposit_amount_cents = round(
          estimated_base_total * deposit_percentage * 100
        )::integer
      )
    ),
  add constraint bookings_payment_status_check
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  add constraint bookings_payment_fields_consistent
    check (
      (
        payment_status = 'unpaid'
        and deposit_paid_at is null
        and stripe_payment_intent_id is null
      )
      or
      (
        payment_status in ('paid', 'refunded')
        and deposit_amount_cents is not null
        and stripe_checkout_session_id is not null
        and stripe_payment_intent_id is not null
        and deposit_paid_at is not null
      )
    );

alter table public.bookings
  add constraint bookings_checkout_requires_deposit_check
    check (
      deposit_amount_cents is not null
      or stripe_checkout_session_id is null
    );

create unique index bookings_stripe_checkout_session_id_idx
  on public.bookings (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index bookings_stripe_payment_intent_id_idx
  on public.bookings (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index bookings_payment_status_idx
  on public.bookings (payment_status);

comment on column public.bookings.deposit_percentage is
  'Booking deposit percentage used for the authoritative server-calculated estimate.';
comment on column public.bookings.deposit_amount_cents is
  'Required booking deposit in integer USD cents; null when pricing requires a custom quote.';
comment on column public.bookings.payment_status is
  'Deposit state: unpaid, paid, or refunded. Separate from appointment confirmation status.';
comment on column public.bookings.stripe_checkout_session_id is
  'Stripe Checkout Session identifier for the booking deposit.';
comment on column public.bookings.stripe_payment_intent_id is
  'Stripe PaymentIntent identifier recorded after a verified successful payment webhook.';
comment on column public.bookings.deposit_paid_at is
  'Database timestamp of the first verified transition to paid.';

create or replace function public.set_booking_deposit_paid_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.payment_status = 'paid'
    and old.payment_status is distinct from 'paid'
    and new.deposit_paid_at is null then
    new.deposit_paid_at := now();
  elsif new.payment_status = 'unpaid' then
    new.deposit_paid_at := null;
    new.stripe_payment_intent_id := null;
  end if;

  return new;
end;
$$;

create trigger set_booking_deposit_paid_at
  before update of payment_status, deposit_paid_at
  on public.bookings
  for each row
  execute function public.set_booking_deposit_paid_at();

revoke all on function public.set_booking_deposit_paid_at()
  from public, anon, authenticated;

-- Existing service_role access and RLS policies remain unchanged. This
-- migration adds no grants; the existing authenticated read grant remains
-- limited to allowlisted admins by the current bookings RLS policy.

commit;
