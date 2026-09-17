"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleBlock } from "@/lib/admin-availability";
import { formatAdminDate, formatAdminTime } from "@/lib/admin-bookings";
import type { BusinessConfig } from "@/lib/business-config";

type AvailabilityManagerProps = {
  blocks: ScheduleBlock[];
  settings: BusinessConfig["bookingSettings"];
  today: string;
  loadError?: boolean;
};

export function AvailabilityManager({
  blocks,
  settings,
  today,
  loadError = false,
}: AvailabilityManagerProps) {
  const router = useRouter();
  const [blockedDate, setBlockedDate] = useState("");
  const [blockedTime, setBlockedTime] = useState("");
  const [note, setNote] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  async function addBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAdding(true);
    setError("");

    try {
      const response = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockedDate,
          blockedTime: blockedTime || null,
          note,
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "The availability block could not be added.");
        return;
      }

      setBlockedDate("");
      setBlockedTime("");
      setNote("");
      router.refresh();
    } catch {
      setError("The availability block could not be added.");
    } finally {
      setIsAdding(false);
    }
  }

  async function removeBlock(block: ScheduleBlock) {
    const label = block.blocked_time
      ? `${formatAdminDate(block.blocked_date)} at ${formatAdminTime(block.blocked_time)}`
      : `all of ${formatAdminDate(block.blocked_date)}`;

    if (!window.confirm(`Remove the availability block for ${label}?`)) return;

    setPendingId(block.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/availability/${block.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "The availability block could not be removed.");
        return;
      }
      router.refresh();
    } catch {
      setError("The availability block could not be removed.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section id="availability" className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Schedule controls</p>
          <h2 className="mt-2 text-2xl font-bold text-navy">Availability</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Block a full date or one configured start time. Pending and confirmed bookings are already unavailable automatically.
          </p>

          <form onSubmit={addBlock} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-navy">Date</span>
              <input
                type="date"
                required
                min={today}
                value={blockedDate}
                onChange={(event) => setBlockedDate(event.target.value)}
                className="booking-input"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-navy">Time to block</span>
              <select
                value={blockedTime}
                onChange={(event) => setBlockedTime(event.target.value)}
                className="booking-input"
              >
                <option value="">Entire date</option>
                {settings.startTimes.map((time) => (
                  <option key={time.value} value={time.value}>{time.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-navy">Internal note <span className="font-normal text-slate-400">(optional)</span></span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                className="booking-input"
                placeholder="Reason for the block"
              />
            </label>
            <button type="submit" disabled={isAdding || loadError} className="button button-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
              {isAdding ? "Adding block…" : "Add availability block"}
            </button>
          </form>
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-bold text-navy">Upcoming blocks</h3>
          {loadError ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Availability blocks could not be loaded. Run the schedule-block migration, then refresh this page.
            </p>
          ) : blocks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No upcoming owner-created blocks.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {blocks.map((block) => (
                <li key={block.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-navy">{formatAdminDate(block.blocked_date)}</p>
                    <p className="mt-1 text-sm font-semibold text-blue-700">
                      {block.blocked_time ? formatAdminTime(block.blocked_time) : "Entire date"}
                    </p>
                    {block.note ? <p className="mt-2 break-words text-sm text-slate-500">{block.note}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === block.id}
                    onClick={() => removeBlock(block)}
                    className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {pendingId === block.id ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}

