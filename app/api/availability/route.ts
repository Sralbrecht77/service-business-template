import { NextResponse } from "next/server";
import { businessConfig } from "@/lib/business-config";
import { addDays, getDateInTimeZone } from "@/lib/booking-rules";
import { getUnavailableSlots } from "@/lib/availability";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const today = getDateInTimeZone(businessConfig.bookingSettings.timeZone);
  const latestAllowed = addDays(
    today,
    businessConfig.bookingSettings.maximumDaysAhead,
  );

  let validDates = true;
  try {
    validDates = addDays(from, 0) === from && addDays(to, 0) === to;
  } catch {
    validDates = false;
  }

  if (
    !datePattern.test(from) ||
    !datePattern.test(to) ||
    !validDates ||
    from > to ||
    from < today ||
    to > latestAllowed
  ) {
    return NextResponse.json(
      { error: "Invalid availability window." },
      { status: 400 },
    );
  }

  try {
    const availability = await getUnavailableSlots(from, to);
    return NextResponse.json(availability, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Public availability lookup failed", error);
    return NextResponse.json(
      { error: "Availability could not be loaded." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
