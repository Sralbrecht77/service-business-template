import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/supabase/auth";

type AvailabilityRouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
  routeContext: AvailabilityRouteContext,
) {
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

  const { id } = await routeContext.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid availability block." }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("schedule_blocks")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Admin schedule block delete failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "The availability block could not be removed." },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Availability block not found." }, { status: 404 });
  }

  revalidatePath("/admin");
  return NextResponse.json(
    { removed: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

