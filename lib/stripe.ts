import "server-only";

import Stripe from "stripe";

export const BOOKING_DEPOSIT_PERCENTAGE = 0.2;
export const CHECKOUT_EXPIRATION_SECONDS = 30 * 60;

let stripeClient: Stripe | undefined;

export function logStripeError(context: string, error: unknown) {
  const stripeError =
    error instanceof Stripe.errors.StripeError ? error : undefined;

  console.error(context, {
    errorName: error instanceof Error ? error.name : "UnknownError",
    stripeType: stripeError?.type ?? null,
    code: stripeError?.code ?? null,
    statusCode: stripeError?.statusCode ?? null,
    message: error instanceof Error ? error.message : "Unknown Stripe error",
    requestId: stripeError?.requestId ?? null,
  });
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  if (!stripeClient) stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function calculateDepositAmountCents(estimatedTotal: number) {
  const estimatedTotalCents = Math.round(estimatedTotal * 100);
  return Math.round(estimatedTotalCents * BOOKING_DEPOSIT_PERCENTAGE);
}
