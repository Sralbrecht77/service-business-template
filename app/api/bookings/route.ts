import { NextResponse } from "next/server";
import { z } from "zod";
import { businessConfig } from "@/lib/business-config";
import { isBookableDate } from "@/lib/booking-rules";
import { calculateEstimate } from "@/lib/pricing";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const bookingSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.string().trim().email().max(254),
    customerPhone: z
      .string()
      .trim()
      .min(7)
      .max(30)
      .regex(/^[0-9+().\-\s]+$/),
    requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    requestedTime: z.string().regex(/^\d{2}:\d{2}$/),
    pickupAddress: z.string().trim().min(5).max(300),
    destinationAddress: z.string().trim().min(5).max(300),
    crewSize: z.number().int(),
    estimatedHours: z.number().finite(),
    roundTripMiles: z.number().finite().min(0).max(10_000),
    hasPiano: z.boolean(),
    hasGunSafe: z.boolean(),
    hasHeavyItem: z.boolean(),
    hasExcessiveStairs: z.boolean(),
    hasLongCarry: z.boolean(),
    moveNotes: z.string().trim().max(2000),
  })
  .strict();

function validationError() {
  return NextResponse.json(
    { error: "Please review the booking details and try again." },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 50_000) {
    return NextResponse.json(
      { error: "The booking request is too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError();
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return validationError();

  const booking = parsed.data;
  const { pricing, travelFees, estimator, bookingSettings } = businessConfig;
  const configuredCrewSizes = pricing.crews.map((crew) => crew.movers);
  const minimumCrewSize = Math.min(...configuredCrewSizes);
  const largestConfiguredCrewSize = Math.max(...configuredCrewSizes);
  const validCrewSize =
    configuredCrewSizes.includes(booking.crewSize) ||
    (booking.crewSize > largestConfiguredCrewSize &&
      booking.crewSize <= estimator.maxCrewSize);
  const validHourIncrement =
    Math.abs(
      (booking.estimatedHours - pricing.minimumHours) / estimator.hourStep -
        Math.round(
          (booking.estimatedHours - pricing.minimumHours) / estimator.hourStep,
        ),
    ) < 0.000_001;

  if (
    booking.crewSize < minimumCrewSize ||
    !validCrewSize ||
    booking.estimatedHours < pricing.minimumHours ||
    booking.estimatedHours > estimator.maxHours ||
    !validHourIncrement ||
    !isBookableDate(booking.requestedDate, bookingSettings) ||
    !bookingSettings.startTimes.some(
      (time) => time.value === booking.requestedTime,
    )
  ) {
    return validationError();
  }

  const estimate = calculateEstimate(
    {
      crewSize: booking.crewSize,
      estimatedHours: booking.estimatedHours,
      roundTripMiles: booking.roundTripMiles,
    },
    pricing,
    travelFees,
  );

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    console.error("Booking service configuration error", error);
    return NextResponse.json(
      { error: "Online booking is not configured yet. Please contact us directly." },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("bookings").insert({
    status: "pending",
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    customer_phone: booking.customerPhone,
    requested_date: booking.requestedDate,
    requested_time: booking.requestedTime,
    pickup_address: booking.pickupAddress,
    destination_address: booking.destinationAddress,
    crew_size: booking.crewSize,
    estimated_hours: booking.estimatedHours,
    round_trip_miles: booking.roundTripMiles,
    hourly_rate: estimate.hourlyRate,
    estimated_labor_cost: estimate.estimatedLaborCost,
    travel_fee: estimate.travelFee,
    estimated_base_total: estimate.estimatedBaseTotal,
    has_piano: booking.hasPiano,
    has_gun_safe: booking.hasGunSafe,
    has_heavy_item: booking.hasHeavyItem,
    has_excessive_stairs: booking.hasExcessiveStairs,
    has_long_carry: booking.hasLongCarry,
    move_notes: booking.moveNotes || null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error:
            "That date and time already has an active request. Please choose another preferred time.",
        },
        { status: 409 },
      );
    }

    console.error("Booking insert failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "We couldn’t save your request. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      confirmation: {
        customerName: booking.customerName,
        requestedDate: booking.requestedDate,
        requestedTime: booking.requestedTime,
        crewSize: booking.crewSize,
        estimatedBaseTotal: estimate.estimatedBaseTotal,
        estimatedLaborCost: estimate.estimatedLaborCost,
        travelFee: estimate.travelFee,
      },
    },
    { status: 201 },
  );
}
