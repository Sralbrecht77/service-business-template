"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { BookingEstimate } from "@/lib/booking-types";

type BookingFlowContextValue = {
  estimate: BookingEstimate | null;
  setEstimate: (estimate: BookingEstimate) => void;
};

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null);

export function BookingFlowProvider({ children }: React.PropsWithChildren) {
  const [estimate, setEstimate] = useState<BookingEstimate | null>(null);
  const value = useMemo(() => ({ estimate, setEstimate }), [estimate]);

  return (
    <BookingFlowContext.Provider value={value}>
      {children}
    </BookingFlowContext.Provider>
  );
}

export function useBookingFlow() {
  const context = useContext(BookingFlowContext);

  if (!context) {
    throw new Error("useBookingFlow must be used within BookingFlowProvider");
  }

  return context;
}
