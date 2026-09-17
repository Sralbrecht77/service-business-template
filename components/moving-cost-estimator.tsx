"use client";

import { useMemo, useState } from "react";
import { useBookingFlow } from "@/components/booking/booking-flow-provider";
import { ArrowIcon, Icon } from "@/components/icons";
import type { BusinessConfig } from "@/lib/business-config";
import { calculateEstimate } from "@/lib/pricing";

type MovingCostEstimatorProps = {
  pricing: BusinessConfig["pricing"];
  travelFees: BusinessConfig["travelFees"];
  estimator: BusinessConfig["estimator"];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function MovingCostEstimator({
  pricing,
  travelFees,
  estimator,
}: MovingCostEstimatorProps) {
  const { setEstimate } = useBookingFlow();
  const sortedCrews = useMemo(
    () => [...pricing.crews].sort((a, b) => a.movers - b.movers),
    [pricing.crews],
  );
  const smallestCrew = sortedCrews[0];
  const largestConfiguredCrew = sortedCrews[sortedCrews.length - 1];

  const [crewSize, setCrewSize] = useState(smallestCrew.movers);
  const [hours, setHours] = useState(pricing.minimumHours);
  const [mileage, setMileage] = useState(0);
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);

  const crewOptions = useMemo(() => {
    const configured = sortedCrews.map((crew) => crew.movers);
    const additional = Array.from(
      { length: Math.max(0, estimator.maxCrewSize - largestConfiguredCrew.movers) },
      (_, index) => largestConfiguredCrew.movers + index + 1,
    );

    return [...configured, ...additional];
  }, [estimator.maxCrewSize, largestConfiguredCrew.movers, sortedCrews]);

  const estimate = useMemo(
    () =>
      calculateEstimate(
        {
          crewSize,
          estimatedHours: hours,
          roundTripMiles: mileage,
        },
        pricing,
        travelFees,
      ),
    [crewSize, hours, mileage, pricing, travelFees],
  );
  const travelNeedsQuote = estimate.travelFee === null;

  const selectedConfig = estimator.details.filter((detail) =>
    selectedDetails.includes(detail.id),
  );
  const quoteItems = selectedConfig.filter((detail) => detail.requiresQuote);
  const conditionItems = selectedConfig.filter((detail) => !detail.requiresQuote);

  function toggleDetail(id: string) {
    setSelectedDetails((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <section id="estimator" className="section bg-slate-50 scroll-mt-6">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mb-12 max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
            {estimator.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.035em] text-navy sm:text-4xl lg:text-5xl">
            {estimator.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            {estimator.description}
          </p>
        </div>

        <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="p-6 sm:p-9 lg:p-12">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2.5 block text-sm font-bold text-navy">Crew size</span>
                <select
                  value={crewSize}
                  onChange={(event) => setCrewSize(Number(event.target.value))}
                  className="min-h-13 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-navy outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {crewOptions.map((size) => (
                    <option key={size} value={size}>
                      {size} movers
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2.5 block text-sm font-bold text-navy">Estimated hours</span>
                <div className="relative">
                  <input
                    type="number"
                    min={pricing.minimumHours}
                    max={estimator.maxHours}
                    step={estimator.hourStep}
                    value={hours}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setHours(
                        Math.min(
                          estimator.maxHours,
                          Math.max(pricing.minimumHours, value || pricing.minimumHours),
                        ),
                      );
                    }}
                    className="min-h-13 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-base font-semibold text-navy outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">hours</span>
                </div>
                <span className="mt-2 block text-xs text-slate-500">
                  {pricing.minimumHours}-hour minimum
                </span>
              </label>
            </div>

            <label className="mt-6 block">
              <span className="mb-2.5 block text-sm font-bold text-navy">Round-trip travel mileage</span>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={mileage}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setMileage(Math.max(0, value || 0));
                  }}
                  className="min-h-13 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-base font-semibold text-navy outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">miles</span>
              </div>
              {travelNeedsQuote ? (
                <span className="mt-2 flex items-center gap-2 text-sm font-bold text-amber-700">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Contact us for travel pricing
                </span>
              ) : (
                <span className="mt-2 block text-xs text-slate-500">
                  Current travel tier: {estimate.travelTierLabel}
                </span>
              )}
            </label>

            <fieldset className="mt-9 border-t border-slate-200 pt-8">
              <legend className="text-base font-bold text-navy">Additional move details</legend>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Select everything that may apply to your move.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {estimator.details.map((detail) => {
                  const checked = selectedDetails.includes(detail.id);

                  return (
                    <label
                      key={detail.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${checked ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDetail(detail.id)}
                        className="mt-0.5 size-5 shrink-0 accent-blue-600"
                      />
                      <span>
                        <span className="block text-sm font-bold text-navy">{detail.label}</span>
                        <span className={`mt-1 block text-xs leading-5 ${detail.requiresQuote ? "text-amber-700" : "text-slate-500"}`}>
                          {detail.note}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="bg-navy p-6 text-white sm:p-9 lg:p-12">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Live estimate</p>
                <h3 className="mt-2 text-2xl font-bold">Your base cost</h3>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-blue-500/20 text-blue-300">
                <Icon name="truck" />
              </div>
            </div>

            <div aria-live="polite">
              <dl className="space-y-4 py-7 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Crew size</dt>
                  <dd className="font-bold">{crewSize} movers</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Hourly crew rate</dt>
                  <dd className="font-bold">{currency.format(estimate.hourlyRate)}/hour</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Estimated hours</dt>
                  <dd className="font-bold">{hours}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Estimated labor cost</dt>
                  <dd className="font-bold">{currency.format(estimate.estimatedLaborCost)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-400">Travel fee</dt>
                  <dd className={`max-w-52 text-right font-bold ${travelNeedsQuote ? "text-amber-300" : ""}`}>
                    {estimate.travelFee !== null
                      ? estimate.travelFee === 0
                        ? "$0"
                        : currency.format(estimate.travelFee)
                      : "Contact us for travel pricing"}
                  </dd>
                </div>
              </dl>

              <div className="border-y border-white/15 py-6">
                <div className="flex items-end justify-between gap-5">
                  <p className="font-bold">Estimated base total</p>
                  <p className="text-right text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                    {estimate.estimatedBaseTotal !== null
                      ? currency.format(estimate.estimatedBaseTotal)
                      : `${currency.format(estimate.estimatedLaborCost)} + travel`}
                  </p>
                </div>
              </div>
            </div>

            {quoteItems.length > 0 ? (
              <div className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                <p className="font-bold text-amber-200">Additional item quote required</p>
                <p className="mt-1">{quoteItems.map((item) => item.label).join(", ")} are not included in the base estimate.</p>
              </div>
            ) : null}

            {conditionItems.length > 0 ? (
              <div className="mt-3 rounded-xl border border-blue-300/20 bg-blue-400/10 p-4 text-sm leading-6 text-blue-100">
                Additional labor charges may apply for {conditionItems.map((item) => item.label.toLowerCase()).join(" and ")}.
              </div>
            ) : null}

            <p className="mt-6 text-xs leading-5 text-slate-400">{estimator.disclaimer}</p>

            <a
              href="#booking"
              onClick={() =>
                setEstimate({
                  ...estimate,
                  hasPiano: selectedDetails.includes("piano"),
                  hasGunSafe: selectedDetails.includes("gunSafe"),
                  hasHeavyItem: selectedDetails.includes("heavyItem"),
                  hasExcessiveStairs: selectedDetails.includes("stairs"),
                  hasLongCarry: selectedDetails.includes("longCarry"),
                })
              }
              className="button button-primary mt-7 w-full"
            >
              {estimator.continueLabel} <ArrowIcon />
            </a>
            <p className="mt-3 text-center text-xs text-slate-500">Scheduling details are confirmed before booking.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
