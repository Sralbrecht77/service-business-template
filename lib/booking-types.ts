import type { EstimateResult } from "@/lib/pricing";

export type SpecialtySelections = {
  hasPiano: boolean;
  hasGunSafe: boolean;
  hasHeavyItem: boolean;
  hasExcessiveStairs: boolean;
  hasLongCarry: boolean;
};

export type BookingEstimate = EstimateResult & SpecialtySelections;

export type BookingRequestPayload = SpecialtySelections & {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedDate: string;
  requestedTime: string;
  pickupAddress: string;
  destinationAddress: string;
  crewSize: number;
  estimatedHours: number;
  roundTripMiles: number;
  moveNotes: string;
};

export type BookingConfirmation = {
  customerName: string;
  requestedDate: string;
  requestedTime: string;
  crewSize: number;
  estimatedBaseTotal: number | null;
  estimatedLaborCost: number;
  travelFee: number | null;
};
