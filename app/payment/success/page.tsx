import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { Icon } from "@/components/icons";
import { businessConfig } from "@/lib/business-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Deposit Status | ${businessConfig.company.name}`,
  robots: { index: false, follow: false },
};

const sessionIdSchema = z
  .string()
  .min(10)
  .max(255)
  .regex(/^cs_(test|live)_[A-Za-z0-9]+$/);

type PaymentSuccessPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const rawSessionId = (await searchParams).session_id;
  const sessionIdResult = sessionIdSchema.safeParse(
    Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId,
  );

  let paymentStatus: "unpaid" | "paid" | "refunded" | null = null;
  if (sessionIdResult.success) {
    try {
      const result = await getSupabaseAdmin()
        .from("bookings")
        .select("payment_status")
        .eq("stripe_checkout_session_id", sessionIdResult.data)
        .maybeSingle();

      if (!result.error) paymentStatus = result.data?.payment_status ?? null;
    } catch {
      paymentStatus = null;
    }
  }

  const depositPaid = paymentStatus === "paid";
  const depositRefunded = paymentStatus === "refunded";

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
          <div className={`px-7 py-10 text-center text-white sm:px-12 ${depositPaid ? "bg-emerald-600" : depositRefunded ? "bg-amber-600" : "bg-blue-600"}`}>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-white/15">
              <Icon name={depositPaid ? "check" : "clock"} className="size-8" />
            </div>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">Secure deposit status</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {depositPaid
                ? "Deposit received"
                : depositRefunded
                  ? "Deposit refunded"
                  : "Payment is being verified"}
            </h1>
          </div>

          <div className="p-7 sm:p-10">
            {depositPaid ? (
              <p className="text-lg leading-8 text-slate-700">
                Thank you. Your booking request and 20% deposit have been received.
              </p>
            ) : depositRefunded ? (
              <p className="text-lg leading-8 text-slate-700">
                This deposit is recorded as refunded. Contact Guidestone if you have questions about the booking request.
              </p>
            ) : (
              <p className="text-lg leading-8 text-slate-700">
                Reaching this page does not prove payment. Stripe’s signed webhook is still updating the authoritative payment status.
              </p>
            )}

            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
              <p className="font-extrabold">Your appointment is not automatically confirmed.</p>
              <p className="mt-2 text-sm leading-6">
                Payment and appointment confirmation are separate. Guidestone Moving will contact you to confirm the requested date and time.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {!depositPaid && !depositRefunded && sessionIdResult.success ? (
                <a
                  href={`/payment/success?session_id=${encodeURIComponent(sessionIdResult.data)}`}
                  className="button button-primary"
                >
                  Check payment status
                </a>
              ) : null}
              <Link href="/" className="button border border-slate-200 bg-slate-50 text-navy hover:bg-slate-100">
                Return to Guidestone Moving
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
