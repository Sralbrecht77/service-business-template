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
  return booking.hourly_rate === null || booking.estimated_labor_cost === null;
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
