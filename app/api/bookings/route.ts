import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { businessConfig, serviceTypeIds } from "@/lib/business-config";
import {
  extensionForMimeType,
  validateBookingPhotos,
} from "@/lib/booking-photos";
import { isBookableDate } from "@/lib/booking-rules";
import { calculateEstimate } from "@/lib/pricing";
import {
  BOOKING_DEPOSIT_PERCENTAGE,
  CHECKOUT_EXPIRATION_SECONDS,
  calculateDepositAmountCents,
  getStripe,
  logStripeError,
} from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const bookingSchema = z
  .object({
    termsAccepted: z.literal(true),
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
    serviceType: z.enum(serviceTypeIds),
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

function termsAcceptanceError() {
  return NextResponse.json(
    {
      error:
        "You must read and agree to the Terms & Conditions before submitting your booking request.",
    },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const uploadConfig = businessConfig.bookingUploads;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const maximumRequestSize =
    uploadConfig.maxFiles * uploadConfig.maxFileSizeBytes + 250_000;
  if (contentLength > maximumRequestSize) {
    return NextResponse.json(
      { error: "The booking request is too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  let photoValues: FormDataEntryValue[] = [];
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const serializedBooking = formData.get("booking");
      if (typeof serializedBooking !== "string") return validationError();

      body = JSON.parse(serializedBooking) as unknown;
      photoValues = formData.getAll("photos");
    } else {
      body = await request.json();
    }
  } catch {
    return validationError();
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("termsAccepted" in body) ||
    body.termsAccepted !== true
  ) {
    return termsAcceptanceError();
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return validationError();

  const booking = parsed.data;
  const photoValidation = await validateBookingPhotos(photoValues, uploadConfig);
  if (photoValidation.error) {
    return NextResponse.json(
      { error: photoValidation.error },
      { status: 400 },
    );
  }
  const photos = photoValidation.files;
  const { estimator, bookingSettings } = businessConfig;
  const serviceType = businessConfig.serviceTypes.find(
    (option) => option.id === booking.serviceType && option.enabled,
  );
  if (!serviceType) return validationError();

  const minimumHours =
    serviceType.pricing?.minimumHours ?? estimator.hourStep;
  const validCrewSize = serviceType.crewSizes.includes(booking.crewSize);
  const validHourIncrement =
    Math.abs(
      (booking.estimatedHours - minimumHours) / estimator.hourStep -
        Math.round(
          (booking.estimatedHours - minimumHours) / estimator.hourStep,
        ),
    ) < 0.000_001;

  if (
    !validCrewSize ||
    booking.estimatedHours < minimumHours ||
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
      serviceType: booking.serviceType,
      crewSize: booking.crewSize,
      estimatedHours: booking.estimatedHours,
      roundTripMiles: booking.roundTripMiles,
    },
    serviceType,
  );
  const specialtyQuoteRequired = ([
    ["piano", booking.hasPiano],
    ["gunSafe", booking.hasGunSafe],
    ["heavyItem", booking.hasHeavyItem],
    ["stairs", booking.hasExcessiveStairs],
    ["longCarry", booking.hasLongCarry],
  ] as const).some(
    ([id, selected]) =>
      selected === true &&
      estimator.details.some(
        (detail) => detail.id === id && detail.requiresQuote,
      ),
  );
  const requiresCustomQuote =
    estimate.requiresCustomQuote || specialtyQuoteRequired;
  const depositAmountCents =
    requiresCustomQuote || estimate.estimatedBaseTotal === null
      ? null
      : calculateDepositAmountCents(estimate.estimatedBaseTotal);

  let stripe: ReturnType<typeof getStripe> | null = null;
  if (depositAmountCents !== null) {
    try {
      stripe = getStripe();
    } catch {
      return NextResponse.json(
        {
          error:
            "Secure deposit checkout is not configured yet. Please contact us directly.",
        },
        { status: 503 },
      );
    }
  }

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

  const { data: createdBooking, error } = await supabase
    .from("bookings")
    .insert({
      status: "pending",
      customer_name: booking.customerName,
      customer_email: booking.customerEmail,
      customer_phone: booking.customerPhone,
      requested_date: booking.requestedDate,
      requested_time: booking.requestedTime,
      pickup_address: booking.pickupAddress,
      destination_address: booking.destinationAddress,
      service_type: booking.serviceType,
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
      terms_accepted: true,
      terms_version: businessConfig.terms.version,
      deposit_percentage: BOOKING_DEPOSIT_PERCENTAGE,
      deposit_amount_cents: depositAmountCents,
      payment_status: "unpaid",
    })
    .select("id")
    .single();

  if (error || !createdBooking) {
    if (error?.code === "23505" || error?.code === "23P01") {
      return NextResponse.json(
        {
          error:
            "That date and time is no longer available. Please choose another preferred time.",
        },
        { status: 409 },
      );
    }

    console.error("Booking insert failed", {
      code: error?.code,
      message: error?.message,
    });
    return NextResponse.json(
      { error: "We couldn’t save your request. Please try again." },
      { status: 500 },
    );
  }

  const uploadedPaths: string[] = [];
  if (photos.length > 0) {
    try {
      const photoRows = [];

      for (const photo of photos) {
        const storagePath = `${createdBooking.id}/${crypto.randomUUID()}.${extensionForMimeType(photo.type)}`;
        const bytes = new Uint8Array(await photo.arrayBuffer());
        const uploadResult = await supabase.storage
          .from(uploadConfig.bucket)
          .upload(storagePath, bytes, {
            contentType: photo.type,
            upsert: false,
          });

        if (uploadResult.error) throw uploadResult.error;
        uploadedPaths.push(storagePath);
        photoRows.push({
          booking_id: createdBooking.id,
          storage_path: storagePath,
          original_name: photo.name,
          mime_type: photo.type,
          size_bytes: photo.size,
        });
      }

      const metadataResult = await supabase
        .from("booking_photos")
        .insert(photoRows);
      if (metadataResult.error) throw metadataResult.error;
    } catch (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(uploadConfig.bucket).remove(uploadedPaths);
      }
      await supabase.from("bookings").delete().eq("id", createdBooking.id);
      console.error("Booking photo upload failed", uploadError);

      return NextResponse.json(
        {
          error:
            "Your photos could not be uploaded, so the booking was not submitted. Please try again or remove the photos.",
        },
        { status: 500 },
      );
    }
  }

  if (depositAmountCents !== null && stripe) {
    const requestOrigin = new URL(request.url).origin;
    let checkoutSession: Stripe.Checkout.Session;

    try {
      checkoutSession = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          payment_method_types: ["card"],
          client_reference_id: createdBooking.id,
          customer_email: booking.customerEmail,
          metadata: {
            booking_id: createdBooking.id,
          },
          payment_intent_data: {
            metadata: {
              booking_id: createdBooking.id,
            },
          },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: depositAmountCents,
                product_data: {
                  name: "Guidestone Moving - 20% Booking Deposit",
                  description:
                    "Deposit only. The remaining move balance is handled separately by Guidestone Moving.",
                },
              },
            },
          ],
          expires_at:
            Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRATION_SECONDS,
          success_url: `${requestOrigin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${requestOrigin}/payment/cancel?booking_id=${encodeURIComponent(createdBooking.id)}`,
        },
        {
          idempotencyKey: `guidestone-booking-deposit-${createdBooking.id}`,
        },
      );
    } catch (checkoutError) {
      logStripeError("Stripe Checkout Session creation failed", checkoutError);
      const cancellationResult = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", createdBooking.id)
        .eq("status", "pending")
        .eq("payment_status", "unpaid");

      if (cancellationResult.error) {
        console.error("Failed to release booking after Checkout creation error", {
          code: cancellationResult.error.code,
        });
      }

      return NextResponse.json(
        {
          error:
            "Secure checkout could not be started. No payment was taken. Please try again; if the slot appears unavailable, contact Guidestone.",
        },
        { status: 502 },
      );
    }

    if (!checkoutSession.url) {
      try {
        await stripe.checkout.sessions.expire(checkoutSession.id);
      } catch (expirationError) {
        logStripeError(
          "Checkout Session cleanup after missing URL failed",
          expirationError,
        );
      }

      const cancellationResult = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          stripe_checkout_session_id: checkoutSession.id,
        })
        .eq("id", createdBooking.id)
        .eq("status", "pending")
        .eq("payment_status", "unpaid");

      if (cancellationResult.error) {
        console.error("Failed to release booking after missing Checkout URL", {
          code: cancellationResult.error.code,
        });
      }

      return NextResponse.json(
        {
          error:
            "Secure checkout is temporarily unavailable. No payment was taken; please try again.",
        },
        { status: 502 },
      );
    }

    const checkoutUpdate = await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: checkoutSession.id })
      .eq("id", createdBooking.id)
      .eq("status", "pending")
      .eq("payment_status", "unpaid")
      .is("stripe_checkout_session_id", null)
      .select("id")
      .maybeSingle();

    if (checkoutUpdate.error || !checkoutUpdate.data) {
      try {
        await stripe.checkout.sessions.expire(checkoutSession.id);
      } catch (expirationError) {
        logStripeError(
          "Checkout Session cleanup after booking update failure failed",
          expirationError,
        );
      }

      const cancellationResult = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          stripe_checkout_session_id: checkoutSession.id,
        })
        .eq("id", createdBooking.id)
        .eq("status", "pending")
        .eq("payment_status", "unpaid");

      if (cancellationResult.error) {
        console.error("Failed to release booking after Checkout save error", {
          code: cancellationResult.error.code,
        });
      }

      return NextResponse.json(
        {
          error:
            "Secure checkout could not be linked to your request. No payment was taken; please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { checkoutUrl: checkoutSession.url },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      confirmation: {
        customerName: booking.customerName,
        requestedDate: booking.requestedDate,
        requestedTime: booking.requestedTime,
        serviceType: booking.serviceType,
        crewSize: booking.crewSize,
        hourlyRate: estimate.hourlyRate,
        estimatedBaseTotal: estimate.estimatedBaseTotal,
        estimatedLaborCost: estimate.estimatedLaborCost,
        travelFee: estimate.travelFee,
        photoCount: photos.length,
        requiresCustomQuote,
        depositPercentage: BOOKING_DEPOSIT_PERCENTAGE,
        depositAmountCents: null,
      },
    },
    { status: 201 },
  );
}
