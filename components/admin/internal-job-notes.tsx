"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type InternalJobNotesProps = {
  bookingId: string;
  initialNotes: string | null;
};

export function InternalJobNotes({
  bookingId,
  initialNotes,
}: InternalJobNotesProps) {
  const router = useRouter();
  const originalNotes = initialNotes ?? "";
  const [notes, setNotes] = useState(originalNotes);
  const [savedNotes, setSavedNotes] = useState(originalNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | undefined
  >();

  async function saveNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const result = (await response.json()) as {
        adminNotes?: string | null;
        error?: string;
      };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.error ?? "The internal job notes could not be saved.",
        });
        return;
      }

      const savedValue = result.adminNotes ?? "";
      setNotes(savedValue);
      setSavedNotes(savedValue);
      setMessage({ type: "success", text: "Internal job notes saved." });
      router.refresh();
    } catch {
      setMessage({
        type: "error",
        text: "The internal job notes could not be saved. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm sm:p-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Private admin-only information</p>
        <h2 className="mt-2 text-lg font-bold text-navy">Internal Job Notes</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Add operational details for the team. Customers cannot see these notes.
        </p>
      </div>

      <form onSubmit={saveNotes} className="mt-5">
        <label htmlFor="admin-notes" className="sr-only">Internal Job Notes</label>
        <textarea
          id="admin-notes"
          rows={7}
          maxLength={10_000}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setMessage(undefined);
          }}
          className="booking-input resize-y bg-white"
          placeholder="Crew instructions, access details, follow-up items, or other private job notes"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">{notes.length.toLocaleString()} / 10,000 characters</p>
          <button
            type="submit"
            disabled={isSaving || notes === savedNotes}
            className="button button-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSaving ? "Saving…" : "Save Notes"}
          </button>
        </div>

        {message ? (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`mt-4 rounded-xl border p-3 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
          >
            {message.text}
          </p>
        ) : null}
      </form>
    </section>
  );
}
