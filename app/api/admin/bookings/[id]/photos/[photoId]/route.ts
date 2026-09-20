import { NextResponse } from "next/server";
import { z } from "zod";
import { businessConfig } from "@/lib/business-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/supabase/auth";

type PhotoRouteContext = {
  params: Promise<{ id: string; photoId: string }>;
};

export async function GET(_request: Request, routeContext: PhotoRouteContext) {
  let adminContext;

  try {
    adminContext = await getAdminContext();
  } catch {
    return NextResponse.json({ error: "Admin authentication is not configured." }, { status: 503 });
  }

  if (!adminContext.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!adminContext.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id, photoId } = await routeContext.params;
  const uuid = z.string().uuid();
  if (!uuid.safeParse(id).success || !uuid.safeParse(photoId).success) {
    return NextResponse.json({ error: "Invalid photo." }, { status: 400 });
  }

  const { data: photo, error } = await adminContext.supabase
    .from("booking_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("booking_id", id)
    .maybeSingle();

  if (error || !photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error: signedUrlError } = await supabase.storage
      .from(businessConfig.bookingUploads.bucket)
      .createSignedUrl(photo.storage_path, 60);

    if (signedUrlError || !data?.signedUrl) throw signedUrlError;

    const response = NextResponse.redirect(data.signedUrl);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (signedUrlError) {
    console.error("Admin booking photo access failed", signedUrlError);
    return NextResponse.json(
      { error: "The private photo could not be opened." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
