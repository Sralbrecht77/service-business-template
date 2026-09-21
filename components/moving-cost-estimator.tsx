"use client";

import { useMemo, useState } from "react";
import { useBookingFlow } from "@/components/booking/booking-flow-provider";
import { ArrowIcon, Icon } from "@/components/icons";
import type {
  BusinessConfig,
  ServiceTypeId,
} from "@/lib/business-config";
import { formatCurrency } from "@/lib/currency";
import { calculateEstimate } from "@/lib/pricing";

type MovingCostEstimatorProps = {
  serviceTypes: BusinessConfig["serviceTypes"];
  defaultServiceTypeId: BusinessConfig["defaultServiceTypeId"];
  estimator: BusinessConfig["estimator"];
};

export function MovingCostEstimator({
  serviceTypes,
  defaultServiceTypeId,
  estimator,
}: MovingCostEstimatorProps) {
  const { setEstimate } = useBookingFlow();
  const enabledServiceTypes = useMemo(
    () => serviceTypes.filter((serviceType) => serviceType.enabled),
    [serviceTypes],
  );
  const initialServiceType =
    enabledServiceTypes.find(
      (serviceType) => serviceType.id === defaultServiceTypeId,
    ) ?? enabledServiceTypes[0];

  const [serviceTypeId, setServiceTypeId] =
    useState<ServiceTypeId>(initialServiceType.id);
  const [crewSize, setCrewSize] = useState(initialServiceType.crewSizes[0]);
  const [hours, setHours] = useState(
    initialServiceType.pricing?.minimumHours ?? estimator.hourStep,
  );
  const [mileageInput, setMileageInput] = useState("0");
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);

  const activeServiceType =
    enabledServiceTypes.find((serviceType) => serviceType.id === serviceTypeId) ??
    initialServiceType;
  const minimumHours =
    activeServiceType.pricing?.minimumHours ?? estimator.hourStep;
  const mileage = mileageInput === "" ? 0 : Number.parseInt(mileageInput, 10);

  const estimate = useMemo(
    () =>
      calculateEstimate(
        {
          serviceType: activeServiceType.id,
          crewSize,
          estimatedHours: hours,
          roundTripMiles: mileage,
        },
        activeServiceType,
      ),
    [activeServiceType, crewSize, hours, mileage],
  );
  const travelNeedsQuote = estimate.travelFee === null;
  const servicePricingNeedsQuote = estimate.hourlyRate === null;
  const travelFeeLabel =
    activeServiceType.id === "crew_only"
      ? "Crew Only travel fee"
      : "Travel / mobilization fee";
  const largestConfiguredCrew = activeServiceType.pricing
    ? Math.max(...activeServiceType.pricing.crews.map((crew) => crew.movers))
    : null;

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

  function selectServiceType(nextServiceTypeId: ServiceTypeId) {
    const nextServiceType = enabledServiceTypes.find(
      (serviceType) => serviceType.id === nextServiceTypeId,
    );
    if (!nextServiceType) return;

    setServiceTypeId(nextServiceTypeId);
    if (!nextServiceType.crewSizes.includes(crewSize)) {
      setCrewSize(nextServiceType.crewSizes[0]);
    }

    const nextMinimumHours =
      nextServiceType.pricing?.minimumHours ?? estimator.hourStep;
    if (hours < nextMinimumHours) setHours(nextMinimumHours);
  }

  function adjustHours(direction: -1 | 1) {
    setHours((current) => {
      const nextHours = current + direction * estimator.hourStep;
      const clampedHours = Math.min(
        estimator.maxHours,
        Math.max(minimumHours, nextHours),
      );

      return Number(clampedHours.toFixed(2));
    });
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
            <fieldset className="mb-8 border-b border-slate-200 pb-8">
              <legend className="text-lg font-bold text-navy">
                What kind of moving help do you need?
              </legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {enabledServiceTypes.map((serviceType) => {
                  const selected = serviceType.id === activeServiceType.id;

                  return (
                    <label
                      key={serviceType.id}
                      className={`cursor-pointer rounded-2xl border p-5 transition focus-within:ring-4 focus-within:ring-blue-100 ${selected ? "border-blue-600 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-300"}`}
                    >
                      <input
                        type="radio"
                        name="serviceType"
                        value={serviceType.id}
                        checked={selected}
                        onChange={() => selectServiceType(serviceType.id)}
                        className="sr-only"
                      />
                      <span className="flex items-center gap-3">
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-blue-700"}`}>
                          <Icon name={serviceType.id === "movers_and_truck" ? "truck" : "users"} className="size-5" />
                        </span>
                        <span className="font-extrabold text-navy">{serviceType.label}</span>
                      </span>
                      <span className="mt-3 block text-sm leading-6 text-slate-600">
                        {serviceType.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2.5 block text-sm font-bold text-navy">
                  {activeServiceType.id === "movers_and_truck" ? "Crew + truck" : "Requested crew size"}
                </span>
                <select
                  value={crewSize}
                  onChange={(event) => setCrewSize(Number(event.target.value))}
                  className="min-h-13 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-navy outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {activeServiceType.crewSizes.map((size) => (
                    <option key={size} value={size}>
                      {size} movers{activeServiceType.id === "movers_and_truck" ? " + truck" : ""}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs text-slate-500">
                  {activeServiceType.pricing?.additionalMoverRate !== undefined &&
                  largestConfiguredCrew !== null
                    ? `Each mover beyond ${largestConfiguredCrew} adds ${formatCurrency(activeServiceType.pricing.additionalMoverRate)}/hour.`
                    : activeServiceType.pricing?.customQuoteFromMovers !== undefined
                      ? `Crews of ${activeServiceType.pricing.customQuoteFromMovers} or more require a custom quote.`
                      : "Crew size helps Guidestone prepare your custom quote."}
                </span>
              </label>

              <div className="block">
                <label
                  htmlFor="estimated-hours"
                  className="mb-2.5 block text-sm font-bold text-navy"
                >
                  Estimated hours
                </label>
                <div className="grid min-h-13 grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                  <button
                    type="button"
                    aria-label="Decrease estimated hours"
                    disabled={hours <= minimumHours}
                    onClick={() => adjustHours(-1)}
                    className="grid min-h-13 place-items-center border-r border-slate-200 bg-slate-50 text-2xl font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <div className="flex min-w-0 items-center justify-center gap-1.5 px-2">
                    <input
                      id="estimated-hours"
                      type="number"
                      min={minimumHours}
                      max={estimator.maxHours}
                      step={estimator.hourStep}
                      value={hours}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setHours(
                          Math.min(
                            estimator.maxHours,
                            Math.max(minimumHours, value || minimumHours),
                          ),
                        );
                      }}
                      aria-label="Estimated hours"
                      className="min-w-0 max-w-20 bg-transparent text-center text-base font-semibold text-navy outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-sm font-semibold text-slate-400">hours</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Increase estimated hours"
                    disabled={hours >= estimator.maxHours}
                    onClick={() => adjustHours(1)}
                    className="grid min-h-13 place-items-center border-l border-slate-200 bg-slate-50 text-2xl font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
                <span className="mt-2 block text-xs text-slate-500">
                  {activeServiceType.pricing
                    ? `${minimumHours}-hour minimum`
                    : "Share the amount of help you expect; final pricing will be confirmed."}
                </span>
              </div>
            </div>

            <label className="mt-6 block">
              <span className="mb-2.5 block text-sm font-bold text-navy">Round-trip travel mileage</span>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={mileageInput}
                  placeholder="Enter miles"
                  onFocus={(event) => event.currentTarget.select()}
                  onBlur={() => {
                    if (mileageInput === "") setMileageInput("0");
                  }}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue === "") {
                      setMileageInput("");
                      return;
                    }

                    const value = Number(nextValue);
                    if (!Number.isFinite(value)) return;
                    setMileageInput(String(Math.max(0, Math.trunc(value))));
                  }}
                  className="min-h-13 w-full rounded-xl border border-slate-300 bg-white px-4 pr-16 text-base font-semibold text-navy outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">miles</span>
              </div>
              {activeServiceType.pricingMode === "custom_quote" ? (
                <span className="mt-2 flex items-center gap-2 text-sm font-bold text-amber-700">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Travel pricing will be confirmed with your custom quote
                </span>
              ) : travelNeedsQuote ? (
                <span className="mt-2 flex items-center gap-2 text-sm font-bold text-amber-700">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Custom travel / mobilization quote required
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
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  {servicePricingNeedsQuote ? "Quote request" : "Live estimate"}
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {servicePricingNeedsQuote ? "Custom quote required" : "Your base cost"}
                </h3>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-blue-500/20 text-blue-300">
                <Icon name={activeServiceType.id === "movers_and_truck" ? "truck" : "users"} />
              </div>
            </div>

            <div aria-live="polite">
              <dl className="space-y-4 py-7 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Service type</dt>
                  <dd className="font-bold">{activeServiceType.label}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Requested crew</dt>
                  <dd className="font-bold">{crewSize} movers</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Hourly rate</dt>
                  <dd className={servicePricingNeedsQuote ? "font-bold text-amber-300" : "font-bold"}>
                    {estimate.hourlyRate === null
                      ? "Custom quote required"
                      : `${formatCurrency(estimate.hourlyRate)}/hour`}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Estimated hours</dt>
                  <dd className="font-bold">{hours}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Estimated labor cost</dt>
                  <dd className={servicePricingNeedsQuote ? "font-bold text-amber-300" : "font-bold"}>
                    {estimate.estimatedLaborCost === null
                      ? "Custom quote required"
                      : formatCurrency(estimate.estimatedLaborCost)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-400">{travelFeeLabel}</dt>
                  <dd className={`max-w-52 text-right font-bold ${travelNeedsQuote ? "text-amber-300" : ""}`}>
                    {estimate.travelFee !== null
                      ? estimate.travelFee === 0
                        ? "$0"
                        : formatCurrency(estimate.travelFee)
                      : "Custom quote required"}
                  </dd>
                </div>
              </dl>

              <div className="border-y border-white/15 py-6">
                <div className="flex items-end justify-between gap-5">
                  <p className="font-bold">Estimated base total</p>
                  <p className="text-right text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                    {estimate.estimatedLaborCost === null
                      ? "Custom quote required"
                      : estimate.estimatedBaseTotal !== null
                        ? formatCurrency(estimate.estimatedBaseTotal)
                        : `${formatCurrency(estimate.estimatedLaborCost)} + custom travel quote`}
                  </p>
                </div>
              </div>
            </div>

            {servicePricingNeedsQuote ? (
              <div className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                <p className="font-bold text-amber-200">Pricing follow-up required</p>
                <p className="mt-1">{activeServiceType.customQuoteMessage}</p>
              </div>
            ) : null}

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
            <p className="mt-3 text-center text-xs text-slate-500">Move dates and start times are confirmed after request review.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
