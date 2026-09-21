import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Icon } from "@/components/icons";
import { businessConfig } from "@/lib/business-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Deposit Not Completed | ${businessConfig.company.name}`,
  robots: { index: false, follow: false },
};

const bookingIdSchema = z.string().uuid();
type CancelPageBooking = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "status" | "payment_status" | "stripe_checkout_session_id"
>;

type PaymentCancelPageProps = {
  searchParams: Promise<{
    booking_id?: string | string[];
    state?: string | string[];
  }>;
};

export default async function PaymentCancelPage({
  searchParams,
}: PaymentCancelPageProps) {
  const values = await searchParams;
  const rawBookingId = values.booking_id;
  const rawState = values.state;
  const bookingIdResult = bookingIdSchema.safeParse(
    Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId,
  );
  const state = Array.isArray(rawState) ? rawState[0] : rawState;

  let canRetry = false;
  let slotReleased = false;
  const sessionExpired = state === "expired";
  let booking: CancelPageBooking | null = null;

  if (bookingIdResult.success) {
    try {
      const result = await getSupabaseAdmin()
        .from("bookings")
        .select("status, payment_status, stripe_checkout_session_id")
        .eq("id", bookingIdResult.data)
        .maybeSingle();

      booking = result.error ? null : result.data;
    } catch {}
  }

  if (
    booking &&
    (booking.payment_status === "paid" ||
      booking.payment_status === "refunded") &&
    booking.stripe_checkout_session_id
  ) {
    redirect(
      `/payment/success?session_id=${encodeURIComponent(booking.stripe_checkout_session_id)}`,
    );
  }

  canRetry = Boolean(
    booking &&
      booking.status === "pending" &&
      booking.payment_status === "unpaid" &&
      booking.stripe_checkout_session_id,
  );
  slotReleased = slotReleased || booking?.status === "cancelled";

  return (
    <main className="hero-grid min-h-screen bg-navy px-5 py-10 text-white sm:px-8 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" aria-label={`${businessConfig.company.name} home`} className="inline-flex">
          <Image
            src={businessConfig.assets.logoPath}
            alt={`${businessConfig.company.name} logo`}
            width={180}
            height={120}
            className="h-20 w-32 rounded-xl object-cover"
          />
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/15 bg-white text-navy shadow-2xl shadow-black/25">
          <div className="bg-slate-700 px-7 py-10 text-center text-white sm:px-12">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-white/15">
              <Icon name="clock" className="size-8" />
            </div>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em] text-slate-200">Stripe Checkout</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Deposit not completed</h1>
          </div>

          <div className="p-7 sm:p-10">
            <p className="text-lg leading-8 text-slate-700">
              The deposit was not completed, so your booking request is not complete and the appointment is not confirmed.
            </p>

            {slotReleased ? (
              <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
                The secure Checkout Session expired and the unpaid booking slot was released. Return to the estimator to submit a new request.
              </div>
            ) : sessionExpired ? (
              <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
                The secure Checkout Session has expired. Stripe’s signed webhook will release an unpaid pending slot; refresh this page before submitting another request.
              </div>
            ) : canRetry && bookingIdResult.success ? (
              <div className="mt-7 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
                Your existing secure Checkout Session may still be available. Retrying uses that same session and does not create another booking.
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                If you recently attempted payment, contact Guidestone before submitting another request if you are unsure of its status.
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {canRetry && bookingIdResult.success ? (
                <a
                  href={`/api/stripe/checkout?booking_id=${encodeURIComponent(bookingIdResult.data)}`}
                  className="button button-primary"
                >
                  Retry secure deposit
                </a>
              ) : null}
              <Link href="/#estimator" className="button border border-slate-200 bg-slate-50 text-navy hover:bg-slate-100">
                Return to the estimator
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
