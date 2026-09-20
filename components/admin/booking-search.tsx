import Link from "next/link";
import type { BookingFilter } from "@/components/admin/booking-filters";

export function BookingSearch({
  query,
  status,
}: {
  query: string;
  status: BookingFilter;
}) {
  const clearHref = status === "all" ? "/admin" : `/admin?status=${status}`;

  return (
    <form action="/admin" method="get" className="flex w-full flex-col gap-3 sm:flex-row">
      {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
      <label className="min-w-0 flex-1">
        <span className="sr-only">Search bookings</span>
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={120}
          placeholder="Search name, phone, email, or address"
          className="booking-input"
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="button button-primary flex-1 sm:flex-none">
          Search
        </button>
        {query ? (
          <Link
            href={clearHref}
            className="button flex-1 border border-slate-300 bg-white text-slate-700 hover:border-blue-300 sm:flex-none"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
