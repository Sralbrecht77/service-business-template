import type {
  BookingServiceType,
  BookingStatus,
  Database,
} from "@/lib/supabase/database.types";
import { businessConfig } from "@/lib/business-config";
import { formatCurrency } from "@/lib/currency";

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export const bookingStatuses: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export function isBookingStatus(value: string): value is BookingStatus {
  return bookingStatuses.includes(value as BookingStatus);
}

export function formatMoney(value: number | null) {
  if (value === null) return "Custom quote required";

  return formatCurrency(value);
}

export function formatServiceType(value: BookingServiceType) {
  return (
    businessConfig.serviceTypes.find((serviceType) => serviceType.id === value)
      ?.label ?? value
  );
}

export function bookingNeedsCustomQuote(booking: Booking) {
  return (
    booking.hourly_rate === null ||
    booking.estimated_labor_cost === null ||
    booking.travel_fee === null ||
    booking.estimated_base_total === null ||
    getBookingSpecialtyItems(booking).some((item) => item.requiresQuote)
  );
}

export function getBookingSpecialtyItems(booking: Booking) {
  const selectedIds = new Set([
    booking.has_piano ? "piano" : null,
    booking.has_gun_safe ? "gunSafe" : null,
    booking.has_heavy_item ? "heavyItem" : null,
    booking.has_excessive_stairs ? "stairs" : null,
    booking.has_long_carry ? "longCarry" : null,
  ]);

  return businessConfig.estimator.details.filter((detail) =>
    selectedIds.has(detail.id),
  );
}

export function formatAdminDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatAdminDateTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatAdminTime(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const value = new Date(Date.UTC(2000, 0, 1, hours, minutes));

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}
