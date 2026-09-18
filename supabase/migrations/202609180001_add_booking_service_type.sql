begin;

alter table public.bookings
  add column service_type text not null default 'movers_and_truck';

alter table public.bookings
  add constraint bookings_service_type_check
  check (service_type in ('movers_and_truck', 'crew_only'));

alter table public.bookings
  alter column hourly_rate drop not null,
  alter column estimated_labor_cost drop not null;

alter table public.bookings
  drop constraint bookings_estimated_hours_check,
  drop constraint bookings_base_total_check;

alter table public.bookings
  add constraint bookings_estimated_hours_check
    check (estimated_hours >= 2 and estimated_hours <= 24),
  add constraint bookings_pricing_fields_check
    check (
      (
        hourly_rate is null
        and estimated_labor_cost is null
        and travel_fee is null
        and estimated_base_total is null
      )
      or
      (
        hourly_rate is not null
        and estimated_labor_cost is not null
        and (
          (travel_fee is null and estimated_base_total is null)
          or (
            travel_fee is not null
            and estimated_base_total = estimated_labor_cost + travel_fee
          )
        )
      )
    );

comment on column public.bookings.service_type is
  'Requested service: movers_and_truck or crew_only.';

commit;
