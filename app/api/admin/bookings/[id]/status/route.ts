import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { bookingStatuses } from "@/lib/admin-bookings";
import { getAdminContext } from "@/lib/supabase/auth";

const statusSchema = z.object({
  status: z.enum(bookingStatuses),
});

type StatusRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: StatusRouteContext) {
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

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid booking." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid status request." }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking status." }, { status: 400 });
  }

  const { data, error } = await adminContext.supabase
    .from("bookings")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("status")
    .maybeSingle();

  if (error) {
    console.error("Admin booking status update failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "The booking status could not be updated." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/bookings/${id}`);

  return NextResponse.json(
    { status: data.status },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
