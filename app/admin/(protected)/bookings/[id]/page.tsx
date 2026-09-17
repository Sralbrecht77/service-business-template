import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusManager } from "@/components/admin/status-manager";
import {
  formatAdminDate,
  formatAdminDateTime,
  formatAdminTime,
  formatMoney,
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

  const specialItems = [
    ["Piano", booking.has_piano],
    ["Gun safe", booking.has_gun_safe],
    ["Heavy item", booking.has_heavy_item],
    ["Excessive stairs", booking.has_excessive_stairs],
    ["Long carry", booking.has_long_carry],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
      <Link href="/admin" className="text-sm font-bold text-blue-700 hover:text-blue-500">← Back to bookings</Link>

      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.19em] text-blue-600">Booking request</p>
            <StatusBadge status={booking.status} />
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">{booking.customer_name}</h1>
          <p className="mt-3 text-slate-600">Requested {formatAdminDate(booking.requested_date)} at {formatAdminTime(booking.requested_time)}</p>
        </div>
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500">Received {formatAdminDateTime(booking.created_at)}</p>
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
            <DetailRow label="Crew size" value={`${booking.crew_size} movers`} />
            <DetailRow label="Estimated hours" value={`${booking.estimated_hours} hours`} />
            <DetailRow label="Round-trip mileage" value={`${booking.round_trip_miles} miles`} />
            <DetailRow label="Hourly crew rate" value={`${formatMoney(booking.hourly_rate)}/hour`} />
            <DetailRow label="Estimated labor cost" value={formatMoney(booking.estimated_labor_cost)} />
            <DetailRow label="Travel fee" value={booking.travel_fee === null ? "Quote required" : formatMoney(booking.travel_fee)} />
            <DetailRow label="Estimated base total" value={booking.estimated_base_total === null ? `${formatMoney(booking.estimated_labor_cost)} + travel quote` : formatMoney(booking.estimated_base_total)} />
          </DetailCard>
        </div>

        <aside className="space-y-6">
          <StatusManager bookingId={booking.id} status={booking.status} />

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
    </div>
  );
}
