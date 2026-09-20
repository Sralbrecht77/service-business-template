import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingFilters, type BookingFilter } from "@/components/admin/booking-filters";
import { BookingSearch } from "@/components/admin/booking-search";
import { BookingsList } from "@/components/admin/bookings-list";
import { AvailabilityManager } from "@/components/admin/availability-manager";
import { addDays, getDateInTimeZone } from "@/lib/booking-rules";
import { businessConfig } from "@/lib/business-config";
import {
  bookingNeedsCustomQuote,
  formatMoney,
  isBookingStatus,
} from "@/lib/admin-bookings";
import { getAdminContext } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: `Bookings | ${businessConfig.company.name} Admin`,
};

type AdminDashboardProps = {
  searchParams: Promise<{
    status?: string | string[];
    q?: string | string[];
  }>;
};

export default async function AdminDashboard({
  searchParams,
}: AdminDashboardProps) {
  const context = await getAdminContext();
  if (!context.user || !context.isAdmin) redirect("/admin/login");

  const params = await searchParams;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const searchQuery = (rawQuery ?? "").trim().slice(0, 120);
  const activeFilter: BookingFilter =
    rawStatus && isBookingStatus(rawStatus) ? rawStatus : "all";
  const today = getDateInTimeZone(businessConfig.bookingSettings.timeZone);
  const [bookingsResult, blocksResult] = await Promise.all([
    context.supabase
      .from("bookings")
      .select("*")
      .order("requested_date", { ascending: true })
      .order("requested_time", { ascending: true }),
    context.supabase
      .from("schedule_blocks")
      .select("*")
      .gte("blocked_date", today)
      .order("blocked_date", { ascending: true })
      .order("blocked_time", { ascending: true, nullsFirst: true }),
  ]);

  if (bookingsResult.error) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
          <h1 className="text-xl font-bold">Bookings could not be loaded.</h1>
          <p className="mt-2 text-sm leading-6">Confirm that the admin-access migration has been run and this user is in `public.admin_users`.</p>
        </div>
      </section>
    );
  }

  const bookings = bookingsResult.data ?? [];
  const nextSevenDays = addDays(today, 6);
  const currentMonth = today.slice(0, 7);
  const confirmedUpcoming = bookings.filter(
    (booking) =>
      booking.status === "confirmed" && booking.requested_date >= today,
  );
  const completedThisMonth = bookings.filter(
    (booking) => {
      if (booking.status !== "completed") return false;

      const completedMonth = booking.completed_at
        ? getDateInTimeZone(
            businessConfig.bookingSettings.timeZone,
            new Date(booking.completed_at),
          ).slice(0, 7)
        : booking.requested_date.slice(0, 7);

      return completedMonth === currentMonth;
    },
  );
  const estimatedValue = (items: typeof bookings) =>
    items.reduce(
      (total, booking) =>
        bookingNeedsCustomQuote(booking) || booking.estimated_base_total === null
          ? total
          : total + booking.estimated_base_total,
      0,
    );
  const summary = [
    {
      label: "Pending requests",
      value: bookings.filter((booking) => booking.status === "pending").length,
      accent: "text-amber-700",
    },
    {
      label: "Confirmed upcoming",
      value: confirmedUpcoming.length,
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
      label: "Completed this month",
      value: completedThisMonth.length,
      accent: "text-emerald-700",
    },
    {
      label: "Estimated confirmed value",
      value: formatMoney(estimatedValue(confirmedUpcoming)),
      accent: "text-blue-700",
    },
    {
      label: "Estimated completed value",
      value: formatMoney(estimatedValue(completedThisMonth)),
      accent: "text-emerald-700",
    },
  ];
  const statusFilteredBookings =
    activeFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === activeFilter);
  const normalizedQuery = searchQuery.toLocaleLowerCase();
  const queryDigits = searchQuery.replace(/\D/g, "");
  const filteredBookings = searchQuery
    ? statusFilteredBookings.filter((booking) => {
        const textMatch = [
          booking.customer_name,
          booking.customer_phone,
          booking.customer_email,
          booking.pickup_address,
          booking.destination_address,
        ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
        const phoneMatch =
          queryDigits.length > 0 &&
          booking.customer_phone.replace(/\D/g, "").includes(queryDigits);

        return textMatch || phoneMatch;
      })
    : statusFilteredBookings;

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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className={`mt-3 text-3xl font-extrabold tracking-tight ${item.accent}`}>{item.value}</p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Dollar figures are estimated booking values, not collected revenue. Custom-quote jobs are excluded.
      </p>

      <AvailabilityManager
        blocks={blocksResult.data ?? []}
        settings={businessConfig.bookingSettings}
        today={today}
        loadError={Boolean(blocksResult.error)}
      />

      <div className="mt-10">
        <div>
          <h2 className="text-xl font-bold text-navy">All bookings</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredBookings.length} matching booking{filteredBookings.length === 1 ? "" : "s"}, ordered by requested date and preferred start time.
          </p>
        </div>
        <div className="mt-5 max-w-3xl">
          <BookingSearch query={searchQuery} status={activeFilter} />
        </div>
        <div className="mt-4">
          <BookingFilters active={activeFilter} query={searchQuery} />
        </div>
      </div>

      <div className="mt-5">
        <BookingsList bookings={filteredBookings} />
      </div>
    </section>
  );
}
