import { NextResponse } from "next/server";
import { z } from "zod";
import { businessConfig, serviceTypeIds } from "@/lib/business-config";
import {
  extensionForMimeType,
  validateBookingPhotos,
} from "@/lib/booking-photos";
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
      },
    },
    { status: 201 },
  );
}
