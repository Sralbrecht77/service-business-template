import type {
  ServiceTypeConfig,
  ServiceTypeId,
} from "@/lib/business-config";

export type EstimateInput = {
  serviceType: ServiceTypeId;
  crewSize: number;
  estimatedHours: number;
  roundTripMiles: number;
};

export type EstimateResult = EstimateInput & {
  hourlyRate: number | null;
  estimatedLaborCost: number | null;
  travelFee: number | null;
  estimatedBaseTotal: number | null;
  travelTierLabel: string | null;
  requiresCustomQuote: boolean;
};

export function calculateEstimate(
  input: EstimateInput,
  serviceType: ServiceTypeConfig,
): EstimateResult {
  if (
    input.serviceType !== serviceType.id ||
    !serviceType.enabled ||
    !serviceType.crewSizes.includes(input.crewSize) ||
    serviceType.pricingMode === "custom_quote" ||
    serviceType.pricing === null
  ) {
    return {
      ...input,
      hourlyRate: null,
      estimatedLaborCost: null,
      travelFee: null,
      estimatedBaseTotal: null,
      travelTierLabel: null,
      requiresCustomQuote: true,
    };
  }

  const pricing = serviceType.pricing;
  const sortedCrews = [...pricing.crews].sort((a, b) => a.movers - b.movers);
  const largestConfiguredCrew = sortedCrews[sortedCrews.length - 1];
  const configuredRate = sortedCrews.find(
    (crew) => crew.movers === input.crewSize,
  )?.rate;
  const hourlyRate =
    configuredRate ??
    (pricing.additionalMoverRate !== undefined && largestConfiguredCrew
      ? largestConfiguredCrew.rate +
        Math.max(0, input.crewSize - largestConfiguredCrew.movers) *
          pricing.additionalMoverRate
      : undefined);

  if (hourlyRate === undefined) {
    return {
      ...input,
      hourlyRate: null,
      estimatedLaborCost: null,
      travelFee: null,
      estimatedBaseTotal: null,
      travelTierLabel: null,
      requiresCustomQuote: true,
    };
  }

  const estimatedLaborCost = hourlyRate * input.estimatedHours;
  const billableMileage = Math.ceil(input.roundTripMiles);
  const travelTier = serviceType.travelFees?.find(
    (tier) =>
      billableMileage >= tier.minMiles &&
      (tier.maxMiles === null || billableMileage <= tier.maxMiles),
  );
  const travelFee = travelTier?.fee ?? null;

  return {
    ...input,
    hourlyRate,
    estimatedLaborCost,
    travelFee,
    estimatedBaseTotal:
      travelFee === null ? null : estimatedLaborCost + travelFee,
    travelTierLabel: travelTier?.mileage ?? null,
    requiresCustomQuote: travelFee === null,
  };
}
