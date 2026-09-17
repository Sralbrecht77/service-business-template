import "server-only";

import { businessConfig } from "@/lib/business-config";
import type { AvailabilityResponse } from "@/lib/availability-types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function normalizeTime(time: string) {
  return time.slice(0, 5);
}

export async function getUnavailableSlots(
  from: string,
  to: string,
): Promise<AvailabilityResponse> {
  const supabase = getSupabaseAdmin();
  const [bookingsResult, blocksResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("requested_date, requested_time")
      .in("status", ["pending", "confirmed"])
      .gte("requested_date", from)
      .lte("requested_date", to),
    supabase
      .from("schedule_blocks")
      .select("blocked_date, blocked_time")
      .gte("blocked_date", from)
      .lte("blocked_date", to),
  ]);

  if (bookingsResult.error) throw bookingsResult.error;
  if (blocksResult.error) throw blocksResult.error;

  const wholeDates = new Set<string>();
  const timesByDate = new Map<string, Set<string>>();

  function addTime(date: string, time: string) {
    const times = timesByDate.get(date) ?? new Set<string>();
    times.add(normalizeTime(time));
    timesByDate.set(date, times);
  }

  for (const booking of bookingsResult.data ?? []) {
    addTime(booking.requested_date, booking.requested_time);
  }

  for (const block of blocksResult.data ?? []) {
    if (block.blocked_time === null) {
      wholeDates.add(block.blocked_date);
    } else {
      addTime(block.blocked_date, block.blocked_time);
    }
  }

  const configuredTimes = businessConfig.bookingSettings.startTimes.map(
    (time) => time.value,
  );

  for (const [date, times] of timesByDate) {
    if (configuredTimes.every((time) => times.has(time))) wholeDates.add(date);
  }

  return {
    unavailableDates: [...wholeDates].sort(),
    unavailableTimes: Object.fromEntries(
      [...timesByDate]
        .filter(([date]) => !wholeDates.has(date))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([date, times]) => [date, [...times].sort()]),
    ),
  };
}
