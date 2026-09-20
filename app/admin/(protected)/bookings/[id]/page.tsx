import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusManager } from "@/components/admin/status-manager";
import { InternalJobNotes } from "@/components/admin/internal-job-notes";
import { BookingPhotoGallery } from "@/components/admin/booking-photo-gallery";
import { CustomQuoteBadge } from "@/components/admin/custom-quote-badge";
import { PrintableJobSheet } from "@/components/admin/printable-job-sheet";
import { PrintJobSheetButton } from "@/components/admin/print-job-sheet-button";
import { RescheduleBooking } from "@/components/admin/reschedule-booking";
import {
  bookingNeedsCustomQuote,
  formatAdminDate,
  formatAdminDateTime,
  formatAdminTime,
  formatMoney,
  formatServiceType,
} from "@/lib/admin-bookings";
import { businessConfig } from "@/lib/business-config";
import { getAdminContext } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: `Booking Details | ${businessConfig.company.name} Admin`,
};

type BookingDetailPageProps = {
  params: Promise<{ id: string }>;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1.5 break-words font-semibold leading-6 text-navy">{value}</dd>
    </div>
  );
}

function DetailCard({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="border-b border-slate-200 pb-4 text-lg font-bold text-navy">{title}</h2>
      <dl>{children}</dl>
    </section>
  );
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const context = await getAdminContext();
  if (!context.user || !context.isAdmin) redirect("/admin/login");

  const { id } = await params;
  const { data: booking, error } = await context.supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !booking) notFound();

  const photosResult = await context.supabase
    .from("booking_photos")
    .select("*")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: true });

  const specialItems = [
    ["Piano — custom quote", booking.has_piano],
    ["Gun safe — custom quote", booking.has_gun_safe],
    ["Heavy item — custom quote", booking.has_heavy_item],
    ["Excessive stairs", booking.has_excessive_stairs],
    ["Long carry", booking.has_long_carry],
  ] as const;
  const customQuoteRequired = bookingNeedsCustomQuote(booking);
  const travelFeeLabel =
    booking.service_type === "crew_only"
      ? "Crew Only travel fee"
      : "Travel / mobilization fee";
  const statusTimestamps = {
    confirmed: booking.confirmed_at,
    completed: booking.completed_at,
    cancelled: booking.cancelled_at,
  } as const;
  const timeline = [
    { label: "Requested", timestamp: booking.created_at },
    ...(booking.confirmed_at ? [{ label: "Confirmed", timestamp: booking.confirmed_at }] : []),
    ...(booking.completed_at ? [{ label: "Completed", timestamp: booking.completed_at }] : []),
    ...(booking.cancelled_at ? [{ label: "Cancelled", timestamp: booking.cancelled_at }] : []),
  ].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  const currentStatusMissingTimestamp =
    booking.status !== "pending" && !statusTimestamps[booking.status];

  return (
    <>
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
      <Link href="/admin" className="text-sm font-bold text-blue-700 hover:text-blue-500">← Back to bookings</Link>

      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.19em] text-blue-600">Booking request</p>
            <StatusBadge status={booking.status} />
            {customQuoteRequired ? <CustomQuoteBadge /> : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">{booking.customer_name}</h1>
          <p className="mt-3 text-slate-600">Requested {formatAdminDate(booking.requested_date)} at {formatAdminTime(booking.requested_time)}</p>
        </div>
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500">Received {formatAdminDateTime(booking.created_at)}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href={`tel:${booking.customer_phone}`} className="button border border-blue-200 bg-blue-50 text-blue-800">Call Customer</a>
        <a href={`mailto:${booking.customer_email}`} className="button border border-blue-200 bg-blue-50 text-blue-800">Email Customer</a>
        <PrintJobSheetButton />
        {booking.status === "completed" && businessConfig.reviewUrl ? (
          <a href={businessConfig.reviewUrl} target="_blank" rel="noreferrer" className="button border border-emerald-200 bg-emerald-50 text-emerald-800">Open Review Link</a>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr_0.72fr]">
        <div className="space-y-6">
          <DetailCard title="Customer contact">
            <DetailRow label="Full name" value={booking.customer_name} />
            <DetailRow label="Phone" value={<a className="text-blue-700 hover:text-blue-500" href={`tel:${booking.customer_phone}`}>{booking.customer_phone}</a>} />
            <DetailRow label="Email" value={<a className="text-blue-700 hover:text-blue-500" href={`mailto:${booking.customer_email}`}>{booking.customer_email}</a>} />
          </DetailCard>

          <DetailCard title="Move addresses">
            <DetailRow label="Moving FROM" value={booking.pickup_address} />
            <DetailRow label="Moving TO" value={booking.destination_address} />
          </DetailCard>
        </div>

        <div className="space-y-6">
          <DetailCard title="Estimate details">
            <DetailRow label="Service type" value={formatServiceType(booking.service_type)} />
            <DetailRow label="Requested crew" value={`${booking.crew_size} movers`} />
            <DetailRow label="Estimated hours" value={`${booking.estimated_hours} hours`} />
            <DetailRow label="Round-trip mileage" value={`${booking.round_trip_miles} miles`} />
            <DetailRow label="Hourly rate" value={booking.hourly_rate === null ? "Custom quote required" : `${formatMoney(booking.hourly_rate)}/hour`} />
            <DetailRow label="Estimated labor cost" value={booking.estimated_labor_cost === null ? "Custom quote required" : formatMoney(booking.estimated_labor_cost)} />
            <DetailRow label={travelFeeLabel} value={booking.travel_fee === null ? "Custom quote required" : formatMoney(booking.travel_fee)} />
            <DetailRow label="Estimated base total" value={customQuoteRequired ? "Custom quote required" : booking.estimated_base_total === null ? `${formatMoney(booking.estimated_labor_cost)} + custom travel quote` : formatMoney(booking.estimated_base_total)} />
          </DetailCard>
        </div>

        <aside className="space-y-6">
          <StatusManager bookingId={booking.id} status={booking.status} />

          {booking.status === "pending" || booking.status === "confirmed" ? (
            <RescheduleBooking
              bookingId={booking.id}
              requestedDate={booking.requested_date}
              requestedTime={booking.requested_time}
              settings={businessConfig.bookingSettings}
            />
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy">Booking timeline</h2>
            <ol className="mt-5 space-y-4 border-l-2 border-blue-100 pl-5">
              {timeline.map((event) => (
                <li key={`${event.label}-${event.timestamp}`} className="relative">
                  <span className="absolute -left-[1.68rem] top-1 size-3 rounded-full border-2 border-white bg-blue-600" />
                  <p className="font-bold text-navy">{event.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatAdminDateTime(event.timestamp)}</p>
                </li>
              ))}
              {currentStatusMissingTimestamp ? (
                <li className="relative">
                  <span className="absolute -left-[1.68rem] top-1 size-3 rounded-full border-2 border-white bg-slate-400" />
                  <p className="font-bold capitalize text-navy">{booking.status}</p>
                  <p className="mt-1 text-xs text-slate-500">Timestamp unavailable for this existing record</p>
                </li>
              ) : null}
            </ol>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy">Move conditions</h2>
            <ul className="mt-4 space-y-3">
              {specialItems.map(([label, selected]) => (
                <li key={label} className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-600">{label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${selected ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{selected ? "Yes" : "No"}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-navy">Move notes</h2>
        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">{booking.move_notes || "No additional notes were provided."}</p>
      </section>

      <BookingPhotoGallery
        bookingId={booking.id}
        photos={photosResult.data ?? []}
        loadError={Boolean(photosResult.error)}
      />

      <InternalJobNotes
        bookingId={booking.id}
        initialNotes={booking.admin_notes}
      />
    </div>
    <PrintableJobSheet booking={booking} />
    </>
  );
}
