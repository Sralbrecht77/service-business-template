import type { EstimateResult } from "@/lib/pricing";
import type { ServiceTypeId } from "@/lib/business-config";

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
  serviceType: ServiceTypeId;
  crewSize: number;
  estimatedHours: number;
  roundTripMiles: number;
  moveNotes: string;
};

export type BookingConfirmation = {
  customerName: string;
  requestedDate: string;
  requestedTime: string;
  serviceType: ServiceTypeId;
  crewSize: number;
  hourlyRate: number | null;
  estimatedBaseTotal: number | null;
  estimatedLaborCost: number | null;
  travelFee: number | null;
};
