import type Stripe from "stripe";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bookingIdSchema = z.string().uuid();

type BookingPaymentRecord = {
  id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded";
  deposit_amount_cents: number | null;
  stripe_checkout_session_id: string | null;
};

function getBookingId(session: Stripe.Checkout.Session) {
  const clientReferenceId = bookingIdSchema.safeParse(
    session.client_reference_id,
  );
  const metadataBookingId = bookingIdSchema.safeParse(
    session.metadata?.booking_id,
  );

  if (
    !clientReferenceId.success ||
    !metadataBookingId.success ||
    clientReferenceId.data !== metadataBookingId.data
  ) {
    return null;
  }

  return clientReferenceId.data;
}

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") return session.payment_intent;
  return session.payment_intent?.id ?? null;
}

async function getBookingPaymentRecord(bookingId: string) {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("bookings")
    .select(
      "id, status, payment_status, deposit_amount_cents, stripe_checkout_session_id",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data as BookingPaymentRecord | null;
}

async function handleCompletedCheckout(session: Stripe.Checkout.Session) {
  const bookingId = getBookingId(session);
  if (!bookingId || session.mode !== "payment") return;

  const booking = await getBookingPaymentRecord(bookingId);
  if (
    !booking ||
    booking.stripe_checkout_session_id !== session.id ||
    booking.payment_status === "paid" ||
    booking.payment_status === "refunded"
  ) {
    return;
  }

  const paymentIntentId = getPaymentIntentId(session);
  const paymentMatchesBooking =
    session.payment_status === "paid" &&
    session.currency?.toLowerCase() === "usd" &&
    session.amount_total === booking.deposit_amount_cents &&
    paymentIntentId !== null;

  if (!paymentMatchesBooking) {
    throw new Error("Completed Checkout Session did not match its booking deposit.");
  }

  const supabase = getSupabaseAdmin();
  const update = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", bookingId)
    .eq("payment_status", "unpaid")
    .eq("stripe_checkout_session_id", session.id);

  if (update.error) throw update.error;
}

async function handleExpiredCheckout(session: Stripe.Checkout.Session) {
  const bookingId = getBookingId(session);
  if (!bookingId || session.mode !== "payment") return;

  const booking = await getBookingPaymentRecord(bookingId);
  if (
    !booking ||
    booking.stripe_checkout_session_id !== session.id ||
    booking.payment_status !== "unpaid" ||
    booking.status !== "pending"
  ) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const update = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .eq("stripe_checkout_session_id", session.id);

  if (update.error) throw update.error;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret) {
    return Response.json(
      { error: "Stripe webhook signing is not configured." },
      { status: 503 },
    );
  }

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCompletedCheckout(
        event.data.object as Stripe.Checkout.Session,
      );
    } else if (event.type === "checkout.session.expired") {
      await handleExpiredCheckout(
        event.data.object as Stripe.Checkout.Session,
      );
    }
  } catch (error) {
    console.error("Stripe webhook processing failed", {
      eventType: event.type,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }

  return Response.json({ received: true });
}
