"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { bookingStatuses } from "@/lib/admin-bookings";
import type { BookingStatus } from "@/lib/supabase/database.types";

export function StatusManager({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: BookingStatus) {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json()) as {
        status?: BookingStatus;
        error?: string;
      };

      if (!response.ok || !result.status) {
        setError(result.error ?? "The booking status could not be updated.");
        return;
      }

      setCurrentStatus(result.status);
      setSelectedStatus(result.status);
      setConfirmCancellation(false);
      router.refresh();
    } catch {
      setError("The booking status could not be updated. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function requestUpdate() {
    if (selectedStatus === currentStatus) return;

    if (selectedStatus === "cancelled" && currentStatus !== "cancelled") {
      setConfirmCancellation(true);
      return;
    }

    void updateStatus(selectedStatus);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-navy">Booking status</span>
        <select
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value as BookingStatus);
            setConfirmCancellation(false);
            setError("");
          }}
          className="booking-input capitalize"
        >
          {bookingStatuses.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>

      {confirmCancellation ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-900">Cancel this booking request?</p>
          <p className="mt-1 text-xs leading-5 text-red-700">The slot will become available for another active request.</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void updateStatus("cancelled")}
              disabled={isSaving}
              className="rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {isSaving ? "Cancelling…" : "Yes, cancel booking"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus(currentStatus);
                setConfirmCancellation(false);
              }}
              disabled={isSaving}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-800"
            >
              Keep booking
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={requestUpdate}
          disabled={isSaving || selectedStatus === currentStatus}
          className="button button-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isSaving ? "Saving…" : "Update status"}
        </button>
      )}

      {error ? <p role="alert" className="mt-3 text-sm font-semibold leading-6 text-red-700">{error}</p> : null}
    </div>
  );
}
