import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingFilters, type BookingFilter } from "@/components/admin/booking-filters";
import { BookingsList } from "@/components/admin/bookings-list";
import { addDays, getDateInTimeZone } from "@/lib/booking-rules";
import { businessConfig } from "@/lib/business-config";
import { isBookingStatus } from "@/lib/admin-bookings";
import { getAdminContext } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: `Bookings | ${businessConfig.company.name} Admin`,
};

type AdminDashboardProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function AdminDashboard({
  searchParams,
}: AdminDashboardProps) {
  const context = await getAdminContext();
  if (!context.user || !context.isAdmin) redirect("/admin/login");

  const params = await searchParams;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const activeFilter: BookingFilter =
    rawStatus && isBookingStatus(rawStatus) ? rawStatus : "all";
  const { data, error } = await context.supabase
    .from("bookings")
    .select("*")
    .order("requested_date", { ascending: true })
    .order("requested_time", { ascending: true });

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
          <h1 className="text-xl font-bold">Bookings could not be loaded.</h1>
          <p className="mt-2 text-sm leading-6">Confirm that the admin-access migration has been run and this user is in `public.admin_users`.</p>
        </div>
      </section>
    );
  }

  const bookings = data ?? [];
  const today = getDateInTimeZone(businessConfig.bookingSettings.timeZone);
  const nextSevenDays = addDays(today, 6);
  const summary = [
    {
      label: "Pending requests",
      value: bookings.filter((booking) => booking.status === "pending").length,
      accent: "text-amber-700",
    },
    {
      label: "Confirmed upcoming",
      value: bookings.filter(
        (booking) =>
          booking.status === "confirmed" && booking.requested_date >= today,
      ).length,
      accent: "text-blue-700",
    },
    {
      label: "Jobs in next 7 days",
      value: bookings.filter(
        (booking) =>
          (booking.status === "pending" || booking.status === "confirmed") &&
          booking.requested_date >= today &&
          booking.requested_date <= nextSevenDays,
      ).length,
      accent: "text-violet-700",
    },
    {
      label: "Completed jobs",
      value: bookings.filter((booking) => booking.status === "completed").length,
      accent: "text-emerald-700",
    },
  ];
  const filteredBookings =
    activeFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === activeFilter);

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Owner dashboard</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Booking requests</h1>
          <p className="mt-3 text-slate-600">Review incoming requests and keep upcoming jobs organized.</p>
        </div>
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">{bookings.length} total requests</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className={`mt-3 text-4xl font-extrabold tracking-tight ${item.accent}`}>{item.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-navy">All bookings</h2>
          <p className="mt-1 text-sm text-slate-500">Ordered by requested date and preferred start time.</p>
        </div>
        <BookingFilters active={activeFilter} />
      </div>

      <div className="mt-5">
        <BookingsList bookings={filteredBookings} />
      </div>
    </section>
  );
}
