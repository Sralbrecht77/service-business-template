import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/supabase/auth";

const notesSchema = z
  .object({
    notes: z.string().max(10_000),
  })
  .strict();

type NotesRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, routeContext: NotesRouteContext) {
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
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  if (!adminContext.isAdmin) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const { id } = await routeContext.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid booking." }, { status: 400 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 25_000) {
    return NextResponse.json(
      { error: "The notes are too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid notes request." },
      { status: 400 },
    );
  }

  const parsed = notesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Internal notes must be 10,000 characters or fewer." },
      { status: 400 },
    );
  }

  const notes = parsed.data.notes.trim();
  const { data, error } = await adminContext.supabase
    .from("bookings")
    .update({ admin_notes: notes || null })
    .eq("id", id)
    .select("admin_notes")
    .maybeSingle();

  if (error) {
    console.error("Admin job notes update failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "The internal job notes could not be saved." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  revalidatePath(`/admin/bookings/${id}`);

  return NextResponse.json(
    { adminNotes: data.admin_notes },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
