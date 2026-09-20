import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBookableDate } from "@/lib/booking-rules";
import { businessConfig } from "@/lib/business-config";
import { getAdminContext } from "@/lib/supabase/auth";

const scheduleSchema = z
  .object({
    requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    requestedTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .strict();

type ScheduleRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, routeContext: ScheduleRouteContext) {
  let adminContext;

  try {
    adminContext = await getAdminContext();
  } catch {
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503 },
    );
  }

  if (!adminContext.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!adminContext.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await routeContext.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid booking." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid schedule request." }, { status: 400 });
  }

  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid date and start time." }, { status: 400 });
  }

  const { requestedDate, requestedTime } = parsed.data;
  const settings = businessConfig.bookingSettings;
  const validTime = settings.startTimes.some(
    (time) => time.value === requestedTime,
  );

  if (!isBookableDate(requestedDate, settings) || !validTime) {
    return NextResponse.json(
      { error: "The new schedule is outside the current booking rules." },
      { status: 400 },
    );
  }

  const [bookingResult, blocksResult, conflictsResult] = await Promise.all([
    adminContext.supabase
      .from("bookings")
      .select("id, status")
      .eq("id", id)
      .maybeSingle(),
    adminContext.supabase
      .from("schedule_blocks")
      .select("blocked_time")
      .eq("blocked_date", requestedDate),
    adminContext.supabase
      .from("bookings")
      .select("id")
      .eq("requested_date", requestedDate)
      .eq("requested_time", requestedTime)
      .in("status", ["pending", "confirmed"])
      .neq("id", id)
      .limit(1),
  ]);

  if (bookingResult.error || blocksResult.error || conflictsResult.error) {
    console.error("Admin reschedule validation failed", {
      booking: bookingResult.error?.message,
      blocks: blocksResult.error?.message,
      conflicts: conflictsResult.error?.message,
    });
    return NextResponse.json(
      { error: "The new schedule could not be validated." },
      { status: 500 },
    );
  }

  if (!bookingResult.data) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (
    bookingResult.data.status !== "pending" &&
    bookingResult.data.status !== "confirmed"
  ) {
    return NextResponse.json(
      { error: "Only pending or confirmed bookings can be rescheduled." },
      { status: 409 },
    );
  }

  const blocked = (blocksResult.data ?? []).some(
    (block) =>
      block.blocked_time === null ||
      block.blocked_time.slice(0, 5) === requestedTime,
  );
  if (blocked || (conflictsResult.data?.length ?? 0) > 0) {
    return NextResponse.json(
      { error: "That date and start time are unavailable." },
      { status: 409 },
    );
  }

  const { data, error } = await adminContext.supabase
    .from("bookings")
    .update({
      requested_date: requestedDate,
      requested_time: requestedTime,
    })
    .eq("id", id)
    .select("requested_date, requested_time")
    .maybeSingle();

  if (error) {
    if (error.code === "23505" || error.code === "23P01") {
      return NextResponse.json(
        { error: "That date and start time just became unavailable." },
        { status: 409 },
      );
    }

    console.error("Admin booking reschedule failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "The booking could not be rescheduled." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/bookings/${id}`);

  return NextResponse.json(
    {
      requestedDate: data.requested_date,
      requestedTime: data.requested_time.slice(0, 5),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
