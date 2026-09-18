"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { useBookingFlow } from "@/components/booking/booking-flow-provider";
import { ArrowIcon, Icon } from "@/components/icons";
import type { BusinessConfig } from "@/lib/business-config";
import type {
  BookingConfirmation,
  BookingRequestPayload,
} from "@/lib/booking-types";
import type { AvailabilityResponse } from "@/lib/availability-types";
import { formatRequestedDate, getBookingWindow } from "@/lib/booking-rules";
import { formatCurrency } from "@/lib/currency";

type BookingRequestSectionProps = {
  company: BusinessConfig["company"];
  settings: BusinessConfig["bookingSettings"];
  serviceTypes: BusinessConfig["serviceTypes"];
};

type BookingStep = "schedule" | "details" | "confirmation";

function EstimateSummary({
  serviceTypes,
  compact = false,
}: {
  serviceTypes: BusinessConfig["serviceTypes"];
  compact?: boolean;
}) {
  const { estimate } = useBookingFlow();
  if (!estimate) return null;

  const serviceType = serviceTypes.find(
    (option) => option.id === estimate.serviceType,
  );
  const serviceLabel = serviceType?.label ?? estimate.serviceType;
  const servicePricingNeedsQuote = estimate.hourlyRate === null;
  const travelFeeLabel =
    serviceType?.id === "crew_only"
      ? "Crew Only travel fee"
      : "Travel / mobilization";

  const selectedDetails = [
    estimate.hasPiano && "Piano",
    estimate.hasGunSafe && "Gun safe",
    estimate.hasHeavyItem && "Large/heavy item",
    estimate.hasExcessiveStairs && "Excessive stairs",
    estimate.hasLongCarry && "Long carry",
  ].filter(Boolean) as string[];

  return (
    <div className={`rounded-2xl bg-navy text-white ${compact ? "p-5" : "p-6 sm:p-7"}`}>
      <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-300">Estimate summary</p>
          <p className="mt-1 font-bold">{serviceLabel} · {estimate.crewSize} movers · {estimate.estimatedHours} hours</p>
        </div>
        <Icon name={serviceType?.id === "crew_only" ? "users" : "truck"} className="size-6 text-blue-300" />
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-slate-400">Service type</dt><dd className="font-bold">{serviceLabel}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-400">Hourly rate</dt><dd className={servicePricingNeedsQuote ? "text-right font-bold text-amber-300" : "font-bold"}>{estimate.hourlyRate === null ? "Custom quote required" : `${formatCurrency(estimate.hourlyRate)}/hr`}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-400">Estimated labor cost</dt><dd className={servicePricingNeedsQuote ? "text-right font-bold text-amber-300" : "font-bold"}>{estimate.estimatedLaborCost === null ? "Custom quote required" : formatCurrency(estimate.estimatedLaborCost)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-400">Round-trip miles</dt><dd className="font-bold">{estimate.roundTripMiles}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-400">{travelFeeLabel}</dt><dd className={estimate.travelFee === null ? "font-bold text-amber-300" : "font-bold"}>{estimate.travelFee === null ? "Custom quote" : formatCurrency(estimate.travelFee)}</dd></div>
      </dl>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/15 pt-5">
        <span className="text-sm font-bold">Estimated base total</span>
        <span className="text-right text-2xl font-extrabold tracking-tight">
          {estimate.estimatedBaseTotal === null
            ? estimate.estimatedLaborCost === null
              ? "Custom quote required"
              : `${formatCurrency(estimate.estimatedLaborCost)} + custom travel quote`
            : formatCurrency(estimate.estimatedBaseTotal)}
        </span>
      </div>
      {servicePricingNeedsQuote && serviceType ? (
        <p className="mt-5 rounded-xl bg-amber-300/10 p-4 text-xs leading-5 text-amber-100">
          {serviceType.customQuoteMessage}
        </p>
      ) : null}
      {selectedDetails.length > 0 ? (
        <div className="mt-5 rounded-xl bg-white/8 p-4 text-xs leading-5 text-slate-300">
          <span className="font-bold text-white">Move details:</span> {selectedDetails.join(", ")}
        </div>
      ) : null}
    </div>
  );
}

function Progress({ step }: { step: BookingStep }) {
  const current = step === "schedule" ? 1 : step === "details" ? 2 : 3;

  return (
    <ol aria-label="Booking progress" className="grid grid-cols-3 gap-2">
      {["Schedule", "Move details", "Confirmation"].map((label, index) => {
        const number = index + 1;
        const active = number <= current;

        return (
          <li key={label} className="min-w-0">
            <div className={`h-1.5 rounded-full ${active ? "bg-blue-600" : "bg-slate-200"}`} />
            <p className={`mt-2 truncate text-[0.68rem] font-bold uppercase tracking-wider ${active ? "text-blue-700" : "text-slate-400"}`}>
              {number}. {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function BookingRequestSection({
  company,
  settings,
  serviceTypes,
}: BookingRequestSectionProps) {
  const { estimate } = useBookingFlow();
  const [step, setStep] = useState<BookingStep>("schedule");
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [availabilityState, setAvailabilityState] = useState<{
    data: AvailabilityResponse;
    completedVersion: number;
    error: string;
  }>({
    data: { unavailableDates: [], unavailableTimes: {} },
    completedVersion: -1,
    error: "",
  });
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const availability = availabilityState.data;
  const availabilityError = availabilityState.error;
  const isLoadingAvailability =
    Boolean(estimate) &&
    availabilityState.completedVersion !== availabilityVersion;

  useEffect(() => {
    if (estimate) {
      setStep("schedule");
      setConfirmation(null);
      setError("");
    }
  }, [estimate]);

  useEffect(() => {
    if (!estimate) return;

    const controller = new AbortController();
    const bookingWindow = getBookingWindow(settings);

    fetch(
      `/api/availability?from=${bookingWindow.minimumDate}&to=${bookingWindow.maximumDate}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Availability request failed");
        return (await response.json()) as AvailabilityResponse;
      })
      .then((result) => {
        setAvailabilityState({
          data: result,
          completedVersion: availabilityVersion,
          error: "",
        });
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) return;

        setAvailabilityState((current) => ({
          data: current.data,
          completedVersion: availabilityVersion,
          error:
            "Live availability could not be loaded. Please try again before choosing a time.",
        }));
      });

    return () => controller.abort();
  }, [availabilityVersion, estimate, settings]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estimate || !requestedDate || !requestedTime) return;

    const formData = new FormData(event.currentTarget);
    const payload: BookingRequestPayload = {
      customerName: String(formData.get("customerName") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      customerPhone: String(formData.get("customerPhone") ?? ""),
      pickupAddress: String(formData.get("pickupAddress") ?? ""),
      destinationAddress: String(formData.get("destinationAddress") ?? ""),
      moveNotes: String(formData.get("moveNotes") ?? ""),
      requestedDate,
      requestedTime,
      serviceType: estimate.serviceType,
      crewSize: estimate.crewSize,
      estimatedHours: estimate.estimatedHours,
      roundTripMiles: estimate.roundTripMiles,
      hasPiano: estimate.hasPiano,
      hasGunSafe: estimate.hasGunSafe,
      hasHeavyItem: estimate.hasHeavyItem,
      hasExcessiveStairs: estimate.hasExcessiveStairs,
      hasLongCarry: estimate.hasLongCarry,
    };

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        confirmation?: BookingConfirmation;
        error?: string;
      };

      if (!response.ok || !result.confirmation) {
        setError(result.error ?? "We couldn’t submit your request. Please try again.");
        if (response.status === 409) {
          setStep("schedule");
          setRequestedTime("");
          setAvailabilityVersion((version) => version + 1);
        }
        return;
      }

      setConfirmation(result.confirmation);
      setStep("confirmation");
    } catch {
      setError("We couldn’t reach the booking service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedTimeLabel =
    settings.startTimes.find((time) => time.value === requestedTime)?.label ??
    requestedTime;
  const confirmationServiceType = confirmation
    ? serviceTypes.find((option) => option.id === confirmation.serviceType)
    : null;
  const confirmationTravelFeeLabel =
    confirmationServiceType?.id === "crew_only"
      ? "Crew Only travel fee"
      : "Travel / mobilization fee";

  return (
    <section id="booking" className="section scroll-mt-6 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Request moving service</p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.035em] text-navy sm:text-4xl lg:text-5xl">Schedule the next step.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">Choose a preferred date and time, then send your move details. This is a request until {company.shortName} confirms it.</p>
        </div>

        {!estimate ? (
          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-blue-200 bg-blue-50 p-8 text-center sm:p-10">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-600 text-white"><Icon name="clock" /></div>
            <h3 className="mt-5 text-2xl font-bold text-navy">Start with your moving estimate</h3>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">Choose your service type, crew size, hours, mileage, and move conditions first. We’ll carry those details into your booking request.</p>
            <a href="#estimator" className="button button-primary mt-7">Build my estimate <ArrowIcon /></a>
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-6xl">
            <Progress step={step} />

            {step === "schedule" ? (
              <div className="mt-8 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                <div>
                  <div className="mb-5">
                    <h3 className="text-2xl font-bold text-navy">Choose a preferred date</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Dates shown follow the current booking window. Final availability is confirmed by our team.</p>
                  </div>
                  <BookingCalendar
                    settings={settings}
                    selectedDate={requestedDate}
                    onSelectDate={(date) => {
                      setRequestedDate(date);
                      setRequestedTime("");
                      setError("");
                    }}
                    unavailableDates={availability.unavailableDates}
                    isLoadingAvailability={
                      isLoadingAvailability || Boolean(availabilityError)
                    }
                  />
                  {isLoadingAvailability ? (
                    <p className="mt-3 text-sm font-semibold text-blue-700">Checking live availability…</p>
                  ) : null}
                  {availabilityError ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p className="font-semibold">{availabilityError}</p>
                      <button
                        type="button"
                        onClick={() => setAvailabilityVersion((version) => version + 1)}
                        className="mt-2 font-bold text-red-900 underline underline-offset-2"
                      >
                        Try again
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                    <h3 className="text-lg font-bold text-navy">Preferred start time</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Select a request window. Times are not guaranteed until confirmed.</p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {settings.startTimes.map((time) => {
                        const unavailable =
                          !requestedDate ||
                          isLoadingAvailability ||
                          Boolean(availabilityError) ||
                          availability.unavailableTimes[requestedDate]?.includes(
                            time.value,
                          );

                        return (
                          <button
                            key={time.value}
                            type="button"
                            disabled={unavailable}
                            onClick={() => {
                              setRequestedTime(time.value);
                              setError("");
                            }}
                            aria-pressed={requestedTime === time.value}
                            className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${requestedTime === time.value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-navy hover:border-blue-300 hover:bg-blue-50"}`}
                          >
                            <span className="block">{time.label}</span>
                            {requestedDate &&
                            unavailable &&
                            !isLoadingAvailability &&
                            !availabilityError ? (
                              <span className="mt-0.5 block text-[0.65rem] font-semibold">Unavailable</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{settings.temporaryDefaultsNotice}</p>
                  </div>
                  <EstimateSummary serviceTypes={serviceTypes} compact />
                  {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">{error}</p> : null}
                  <button
                    type="button"
                    disabled={!requestedDate || !requestedTime}
                    onClick={() => setStep("details")}
                    className="button button-primary w-full disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Continue with this request <ArrowIcon />
                  </button>
                </div>
              </div>
            ) : null}

            {step === "details" ? (
              <form onSubmit={submitBooking} className="mt-8 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-navy">Your move details</h3>
                      <p className="mt-2 text-sm text-slate-500">All fields marked required help us review your request.</p>
                    </div>
                    <button type="button" onClick={() => setStep("schedule")} className="text-left text-sm font-bold text-blue-700 hover:text-blue-500">← Change schedule</button>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm font-bold text-navy">Full name <span className="text-blue-600">*</span></span>
                      <input name="customerName" autoComplete="name" required minLength={2} maxLength={120} className="booking-input" />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-bold text-navy">Phone <span className="text-blue-600">*</span></span>
                      <input name="customerPhone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} className="booking-input" />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-bold text-navy">Email <span className="text-blue-600">*</span></span>
                      <input name="customerEmail" type="email" autoComplete="email" required maxLength={254} className="booking-input" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm font-bold text-navy">Where are you moving FROM? <span className="text-blue-600">*</span></span>
                      <span className="mb-2 block text-xs leading-5 text-slate-500">Enter the full address where the moving crew should start.</span>
                      <input name="pickupAddress" autoComplete="street-address" required minLength={5} maxLength={300} className="booking-input" placeholder="Street address, city, state, ZIP" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm font-bold text-navy">Where are you moving TO? <span className="text-blue-600">*</span></span>
                      <span className="mb-2 block text-xs leading-5 text-slate-500">Enter the full address where the moving crew should finish.</span>
                      <input name="destinationAddress" required minLength={5} maxLength={300} className="booking-input" placeholder="Street address, city, state, ZIP" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm font-bold text-navy">Notes or special instructions</span>
                      <textarea name="moveNotes" rows={5} maxLength={2000} className="booking-input resize-y" placeholder="Access details, item notes, parking instructions, or anything else we should know" />
                    </label>
                  </div>
                </div>

                <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Requested schedule</p>
                    <p className="mt-2 font-bold text-navy">{formatRequestedDate(requestedDate)}</p>
                    <p className="mt-1 text-sm text-slate-600">Preferred start: {selectedTimeLabel}</p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">This request is not an appointment until {company.shortName} confirms it.</p>
                  </div>
                  <EstimateSummary serviceTypes={serviceTypes} compact />
                  {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">{error}</p> : null}
                  <button type="submit" disabled={isSubmitting} className="button button-primary w-full disabled:cursor-wait disabled:opacity-60">
                    {isSubmitting ? "Submitting request…" : "Submit booking request"}
                    {!isSubmitting ? <ArrowIcon /> : null}
                  </button>
                  <p className="text-center text-xs leading-5 text-slate-500">No payment is collected. We’ll contact you to finalize the appointment.</p>
                </div>
              </form>
            ) : null}

            {step === "confirmation" && confirmation ? (
              <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-[2rem] border border-blue-200 bg-white shadow-xl shadow-blue-950/10">
                <div className="bg-blue-600 px-7 py-9 text-center text-white sm:px-10">
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-white/15"><Icon name="check" className="size-8" /></div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Request received</p>
                  <h3 className="mt-2 text-3xl font-bold">Thanks, {confirmation.customerName}.</h3>
                  <p className="mx-auto mt-3 max-w-xl leading-7 text-blue-100">{company.shortName} will contact you to review the details and finalize your appointment.</p>
                </div>
                <dl className="grid gap-px bg-slate-200 sm:grid-cols-2">
                  {[
                    ["Requested date", formatRequestedDate(confirmation.requestedDate)],
                    ["Preferred time", settings.startTimes.find((time) => time.value === confirmation.requestedTime)?.label ?? confirmation.requestedTime],
                    ["Service type", confirmationServiceType?.label ?? confirmation.serviceType],
                    ["Requested crew", `${confirmation.crewSize} movers`],
                    ["Hourly rate", confirmation.hourlyRate === null ? "Custom quote required" : `${formatCurrency(confirmation.hourlyRate)}/hour`],
                    ["Estimated labor cost", confirmation.estimatedLaborCost === null ? "Custom quote required" : formatCurrency(confirmation.estimatedLaborCost)],
                    [confirmationTravelFeeLabel, confirmation.travelFee === null ? "Custom quote required" : formatCurrency(confirmation.travelFee)],
                    ["Estimated base total", confirmation.estimatedBaseTotal === null ? confirmation.estimatedLaborCost === null ? "Custom quote required" : `${formatCurrency(confirmation.estimatedLaborCost)} + custom travel quote` : formatCurrency(confirmation.estimatedBaseTotal)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white p-6">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                      <dd className="mt-2 font-bold text-navy">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="p-7 text-center sm:p-9">
                  {confirmation.hourlyRate === null && confirmationServiceType ? (
                    <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                      {confirmationServiceType.customQuoteMessage}
                    </p>
                  ) : null}
                  <p className="text-sm leading-6 text-slate-600">This is a booking request, not a guaranteed appointment. Keep an eye on your phone and email for confirmation.</p>
                  <a href="#top" className="mt-5 inline-flex text-sm font-bold text-blue-700 hover:text-blue-500">Return to top ↑</a>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
