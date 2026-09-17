import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addDays, getDateInTimeZone } from "@/lib/booking-rules";
import { businessConfig } from "@/lib/business-config";
import { getAdminContext } from "@/lib/supabase/auth";

const blockSchema = z
  .object({
    blockedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    blockedTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    note: z.string().trim().max(500),
  })
  .strict();

export async function POST(request: Request) {
  let context;
  try {
    context = await getAdminContext();
  } catch {
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503 },
    );
  }

  if (!context.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!context.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid availability block." }, { status: 400 });
  }

  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Review the block details and try again." }, { status: 400 });
  }

  const { blockedDate, blockedTime, note } = parsed.data;
  const today = getDateInTimeZone(businessConfig.bookingSettings.timeZone);
  let validDate = true;
  try {
    validDate = addDays(blockedDate, 0) === blockedDate;
  } catch {
    validDate = false;
  }

  const validTime =
    blockedTime === null ||
    businessConfig.bookingSettings.startTimes.some(
      (time) => time.value === blockedTime,
    );

  if (!validDate || blockedDate < today || !validTime) {
    return NextResponse.json(
      { error: "Choose a valid upcoming date and configured start time." },
      { status: 400 },
    );
  }

  const { data, error } = await context.supabase
    .from("schedule_blocks")
    .insert({
      created_by: context.user.id,
      blocked_date: blockedDate,
      blocked_time: blockedTime,
      note: note || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505" || error.code === "23P01") {
      return NextResponse.json(
        { error: "That date or time already has an overlapping availability block." },
        { status: 409 },
      );
    }

    console.error("Admin schedule block insert failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "The availability block could not be added." },
      { status: 500 },
    );
  }

  revalidatePath("/admin");
  return NextResponse.json(
    { block: data },
    { status: 201, headers: { "Cache-Control": "private, no-store" } },
  );
}
