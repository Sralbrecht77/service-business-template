import Link from "next/link";
import type { BookingStatus } from "@/lib/supabase/database.types";

export type BookingFilter = BookingStatus | "all";

const filters: Array<{ value: BookingFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function BookingFilters({ active }: { active: BookingFilter }) {
  return (
    <nav aria-label="Filter bookings" className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => (
        <Link
          key={filter.value}
          href={filter.value === "all" ? "/admin" : `/admin?status=${filter.value}`}
          aria-current={active === filter.value ? "page" : undefined}
          className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${active === filter.value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}
        >
          {filter.label}
        </Link>
      ))}
    </nav>
  );
}
