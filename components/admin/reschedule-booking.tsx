"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getBookingWindow } from "@/lib/booking-rules";
import type { BusinessConfig } from "@/lib/business-config";

export function RescheduleBooking({
  bookingId,
  requestedDate,
  requestedTime,
  settings,
}: {
  bookingId: string;
  requestedDate: string;
  requestedTime: string;
  settings: BusinessConfig["bookingSettings"];
}) {
  const router = useRouter();
  const bookingWindow = getBookingWindow(settings);
  const [date, setDate] = useState(requestedDate);
  const [time, setTime] = useState(requestedTime.slice(0, 5));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | undefined
  >();

  async function reschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedDate: date, requestedTime: time }),
      });
      const result = (await response.json()) as {
        requestedDate?: string;
        requestedTime?: string;
        error?: string;
      };

      if (!response.ok || !result.requestedDate || !result.requestedTime) {
        setMessage({
          type: "error",
          text: result.error ?? "The booking could not be rescheduled.",
        });
        return;
      }

      setDate(result.requestedDate);
      setTime(result.requestedTime);
      setMessage({ type: "success", text: "Booking rescheduled successfully." });
      router.refresh();
    } catch {
      setMessage({
        type: "error",
        text: "The booking could not be rescheduled. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-navy">Reschedule Job</h2>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        The same booking window, blocked times, and collision rules apply.
      </p>
      <form onSubmit={reschedule} className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-navy">New date</span>
          <input
            type="date"
            required
            min={bookingWindow.minimumDate}
            max={bookingWindow.maximumDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="booking-input"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-navy">New start time</span>
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="booking-input"
          >
            {settings.startTimes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="button button-primary w-full disabled:cursor-wait disabled:opacity-60"
        >
          {isSaving ? "Checking availability…" : "Save New Schedule"}
        </button>
      </form>
      {message ? (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`mt-4 rounded-xl border p-3 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
