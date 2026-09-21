alter table public.bookings
  add column if not exists terms_accepted boolean not null default false,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

comment on column public.bookings.terms_accepted is
  'Whether the customer actively accepted the Terms & Conditions for this booking request.';

comment on column public.bookings.terms_accepted_at is
  'Database-controlled timestamp for the customer Terms & Conditions acceptance.';

comment on column public.bookings.terms_version is
  'Version identifier for the Terms & Conditions accepted by the customer.';

create or replace function public.set_booking_terms_accepted_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.terms_accepted then
    if tg_op = 'INSERT' then
      new.terms_accepted_at := now();
    elsif not old.terms_accepted then
      new.terms_accepted_at := now();
    else
      new.terms_accepted_at := old.terms_accepted_at;
    end if;
  else
    new.terms_accepted_at := null;
    new.terms_version := null;
  end if;

  return new;
end;
$$;

drop trigger if exists set_booking_terms_accepted_at on public.bookings;

create trigger set_booking_terms_accepted_at
before insert or update of terms_accepted, terms_accepted_at, terms_version
on public.bookings
for each row
execute function public.set_booking_terms_accepted_at();

alter table public.bookings
  drop constraint if exists bookings_terms_acceptance_consistent;

alter table public.bookings
  add constraint bookings_terms_acceptance_consistent
  check (
    (
      not terms_accepted
      and terms_accepted_at is null
      and terms_version is null
    )
    or
    (
      terms_accepted
      and terms_accepted_at is not null
      and nullif(btrim(terms_version), '') is not null
    )
  );
