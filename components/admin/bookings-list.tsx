import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  bookingNeedsCustomQuote,
  formatAdminDate,
  formatAdminTime,
  formatMoney,
  formatServiceType,
  type Booking,
} from "@/lib/admin-bookings";

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="font-bold text-navy">No bookings match this filter.</p>
        <p className="mt-2 text-sm text-slate-500">Try another status to see more requests.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 lg:hidden">
        {bookings.map((booking) => (
          <Link
            key={booking.id}
            href={`/admin/bookings/${booking.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-navy">{formatAdminDate(booking.requested_date)}</p>
                <p className="mt-1 text-sm font-semibold text-blue-700">{formatAdminTime(booking.requested_time)}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-navy">{booking.customer_name}</h3>
            <p className="mt-1 text-sm text-slate-600">{booking.customer_phone} · {booking.customer_email}</p>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <p><span className="font-extrabold uppercase tracking-wide text-blue-700">Moving FROM:</span> {booking.pickup_address}</p>
              <p><span className="font-extrabold uppercase tracking-wide text-blue-700">Moving TO:</span> {booking.destination_address}</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-slate-500">{formatServiceType(booking.service_type)} · {booking.crew_size} movers · {booking.estimated_hours} hrs</span>
              <span className="text-right font-extrabold text-navy">{bookingNeedsCustomQuote(booking) ? "Custom quote required" : formatMoney(booking.estimated_base_total)}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white lg:block">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead className="bg-slate-100 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">Requested</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Move</th>
              <th className="px-5 py-4">Service / crew</th>
              <th className="px-5 py-4">Estimate</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="align-top transition hover:bg-blue-50/40">
                <td className="whitespace-nowrap px-5 py-5">
                  <p className="font-bold text-navy">{formatAdminDate(booking.requested_date)}</p>
                  <p className="mt-1 text-sm font-semibold text-blue-700">{formatAdminTime(booking.requested_time)}</p>
                </td>
                <td className="px-5 py-5 font-bold text-navy">{booking.customer_name}</td>
                <td className="px-5 py-5 text-sm text-slate-600">
                  <p>{booking.customer_phone}</p>
                  <p className="mt-1">{booking.customer_email}</p>
                </td>
                <td className="max-w-80 px-5 py-5 text-sm leading-6 text-slate-600">
                  <p><span className="font-extrabold uppercase tracking-wide text-blue-700">FROM:</span> {booking.pickup_address}</p>
                  <p className="mt-2"><span className="font-extrabold uppercase tracking-wide text-blue-700">TO:</span> {booking.destination_address}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600"><span className="font-bold text-navy">{formatServiceType(booking.service_type)}</span><br />{booking.crew_size} movers · {booking.estimated_hours} hours</td>
                <td className="whitespace-nowrap px-5 py-5 font-extrabold text-navy">{bookingNeedsCustomQuote(booking) ? "Custom quote required" : formatMoney(booking.estimated_base_total)}</td>
                <td className="px-5 py-5"><StatusBadge status={booking.status} /></td>
                <td className="px-5 py-5 text-right">
                  <Link href={`/admin/bookings/${booking.id}`} className="text-sm font-extrabold text-blue-700 hover:text-blue-500">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
