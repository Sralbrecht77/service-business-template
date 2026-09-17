export type AvailabilityResponse = {
  unavailableDates: string[];
  unavailableTimes: Record<string, string[]>;
};

