begin;

alter table public.bookings
  add column admin_notes text;

alter table public.bookings
  add constraint bookings_admin_notes_length_check
  check (admin_notes is null or char_length(admin_notes) <= 10000);

comment on column public.bookings.admin_notes is
  'Private internal job notes visible and editable only by authorized admins.';

-- Preserve column-level update permissions. Authenticated admins can update
-- only status (from the prior migration) and this new internal-notes column.
grant update (admin_notes) on table public.bookings to authenticated;

commit;
