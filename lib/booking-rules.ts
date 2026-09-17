import type { BusinessConfig } from "@/lib/business-config";

type BookingSettings = BusinessConfig["bookingSettings"];

function parseDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const value = new Date(Date.UTC(year, month - 1, day));

  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    return null;
  }

  return value;
}

export function toDateString(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function addDays(date: string, days: number) {
  const value = parseDate(date);
  if (!value) throw new Error("Invalid date");
  value.setUTCDate(value.getUTCDate() + days);
  return toDateString(value);
}

export function getDateInTimeZone(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function getBookingWindow(settings: BookingSettings, now = new Date()) {
  const today = getDateInTimeZone(settings.timeZone, now);

  return {
    minimumDate: addDays(today, settings.minimumAdvanceDays),
    maximumDate: addDays(today, settings.maximumDaysAhead),
  };
}

export function isBookableDate(
  date: string,
  settings: BookingSettings,
  now = new Date(),
) {
  const parsed = parseDate(date);
  if (!parsed) return false;

  const { minimumDate, maximumDate } = getBookingWindow(settings, now);

  return (
    date >= minimumDate &&
    date <= maximumDate &&
    settings.bookableWeekdays.includes(parsed.getUTCDay())
  );
}

export function formatRequestedDate(date: string) {
  const value = parseDate(date);
  if (!value) return date;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}
