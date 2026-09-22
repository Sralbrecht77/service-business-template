import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, logStripeError } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bookingIdSchema = z.string().uuid();
type RetryBooking = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "status" | "payment_status" | "stripe_checkout_session_id"
>;

function cancelPage(origin: string, state: string, bookingId?: string) {
  const url = new URL("/payment/cancel", origin);
  url.searchParams.set("state", state);
  if (bookingId) url.searchParams.set("booking_id", bookingId);
  return NextResponse.redirect(url, 303);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const bookingIdResult = bookingIdSchema.safeParse(
    requestUrl.searchParams.get("booking_id"),
  );

  if (!bookingIdResult.success) {
    return cancelPage(requestUrl.origin, "invalid");
  }

  const bookingId = bookingIdResult.data;
  let booking: RetryBooking | null = null;
  try {
    const result = await getSupabaseAdmin()
      .from("bookings")
      .select("status, payment_status, stripe_checkout_session_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (result.error) throw result.error;
    booking = result.data;
  } catch {
    return cancelPage(requestUrl.origin, "unavailable", bookingId);
  }

  if (!booking?.stripe_checkout_session_id) {
    return cancelPage(requestUrl.origin, "unavailable", bookingId);
  }

  if (booking.payment_status === "paid" || booking.payment_status === "refunded") {
    const successUrl = new URL("/payment/success", requestUrl.origin);
    successUrl.searchParams.set(
      "session_id",
      booking.stripe_checkout_session_id,
    );
    return NextResponse.redirect(successUrl, 303);
  }

  if (booking.status !== "pending") {
    return cancelPage(requestUrl.origin, "expired", bookingId);
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(
      booking.stripe_checkout_session_id,
    );
    const sessionMatchesBooking =
      session.client_reference_id === bookingId &&
      session.metadata?.booking_id === bookingId;

    if (!sessionMatchesBooking) {
      return cancelPage(requestUrl.origin, "unavailable", bookingId);
    }

    if (
      session.status === "open" &&
      session.payment_status === "unpaid" &&
      session.url
    ) {
      return NextResponse.redirect(session.url, 303);
    }

    if (session.payment_status === "paid") {
      const successUrl = new URL("/payment/success", requestUrl.origin);
      successUrl.searchParams.set("session_id", session.id);
      return NextResponse.redirect(successUrl, 303);
    }

    return cancelPage(requestUrl.origin, "expired", bookingId);
  } catch (error) {
    logStripeError("Stripe Checkout Session retrieval failed", error);
    return cancelPage(requestUrl.origin, "unavailable", bookingId);
  }
}
