import type { BusinessConfig } from "@/lib/business-config";

export type EstimateInput = {
  crewSize: number;
  estimatedHours: number;
  roundTripMiles: number;
};

export type EstimateResult = EstimateInput & {
  hourlyRate: number;
  estimatedLaborCost: number;
  travelFee: number | null;
  estimatedBaseTotal: number | null;
  travelTierLabel: string | null;
};

export function calculateEstimate(
  input: EstimateInput,
  pricing: BusinessConfig["pricing"],
  travelFees: BusinessConfig["travelFees"],
): EstimateResult {
  const sortedCrews = [...pricing.crews].sort((a, b) => a.movers - b.movers);
  const largestConfiguredCrew = sortedCrews[sortedCrews.length - 1];
  const configuredRate = sortedCrews.find(
    (crew) => crew.movers === input.crewSize,
  )?.rate;
  const hourlyRate =
    configuredRate ??
    largestConfiguredCrew.rate +
      Math.max(0, input.crewSize - largestConfiguredCrew.movers) *
        pricing.additionalMoverRate;
  const estimatedLaborCost = hourlyRate * input.estimatedHours;
  const billableMileage = Math.ceil(input.roundTripMiles);
  const travelTier = travelFees.find(
    (tier) =>
      billableMileage >= tier.minMiles && billableMileage <= tier.maxMiles,
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
  };
}
