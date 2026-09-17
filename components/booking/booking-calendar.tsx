"use client";

import { useEffect, useMemo, useState } from "react";
import type { BusinessConfig } from "@/lib/business-config";
import {
  formatRequestedDate,
  getBookingWindow,
  isBookableDate,
  toDateString,
} from "@/lib/booking-rules";

type BookingCalendarProps = {
  settings: BusinessConfig["bookingSettings"];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthStart(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function shiftMonth(date: string, amount: number) {
  const [year, month] = date.split("-").map(Number);
  return toDateString(new Date(Date.UTC(year, month - 1 + amount, 1)));
}

export function BookingCalendar({
  settings,
  selectedDate,
  onSelectDate,
}: BookingCalendarProps) {
  const [referenceNow, setReferenceNow] = useState<Date | null>(null);
  const [visibleMonth, setVisibleMonth] = useState("");
  const bookingWindow = referenceNow
    ? getBookingWindow(settings, referenceNow)
    : null;
  const minimumMonth = bookingWindow
    ? monthStart(bookingWindow.minimumDate)
    : "";
  const maximumMonth = bookingWindow
    ? monthStart(bookingWindow.maximumDate)
    : "";

  useEffect(() => {
    setReferenceNow(new Date());
  }, []);

  useEffect(() => {
    if (!minimumMonth) return;
    setVisibleMonth((current) =>
      !current || current < minimumMonth || current > maximumMonth
        ? minimumMonth
        : current,
    );
  }, [maximumMonth, minimumMonth]);

  const days = useMemo(() => {
    if (!visibleMonth || !referenceNow) return [];
    const [year, month] = visibleMonth.split("-").map(Number);
    const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

    return Array.from({ length: 42 }, (_, index) => {
      const value = new Date(Date.UTC(year, month - 1, index - firstDay + 1));
      const date = toDateString(value);

      return {
        date,
        day: value.getUTCDate(),
        inMonth: value.getUTCMonth() === month - 1,
      };
    });
  }, [referenceNow, visibleMonth]);

  const monthLabel = visibleMonth
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }).format(new Date(`${visibleMonth}T00:00:00Z`))
    : "Loading calendar…";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
          disabled={visibleMonth <= minimumMonth}
          aria-label="Previous month"
          className="grid size-10 place-items-center rounded-xl border border-slate-200 text-navy transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span aria-hidden="true">←</span>
        </button>
        <p className="font-bold text-navy">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
          disabled={visibleMonth >= maximumMonth}
          aria-label="Next month"
          className="grid size-10 place-items-center rounded-xl border border-slate-200 text-navy transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 text-center">
        {weekdays.map((weekday) => (
          <span key={weekday} className="py-2 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            {weekday}
          </span>
        ))}
        {days.map((item) => {
          const bookable =
            item.inMonth &&
            referenceNow !== null &&
            isBookableDate(item.date, settings, referenceNow);
          const selected = item.date === selectedDate;

          return (
            <div key={item.date} className="grid aspect-square place-items-center p-0.5">
              {item.inMonth ? (
                <button
                  type="button"
                  disabled={!bookable}
                  onClick={() => onSelectDate(item.date)}
                  aria-label={formatRequestedDate(item.date)}
                  aria-pressed={selected}
                  className={`grid size-full max-h-11 max-w-11 place-items-center rounded-xl text-sm font-bold transition ${selected ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" : bookable ? "text-navy hover:bg-blue-50 hover:text-blue-700" : "cursor-not-allowed text-slate-300 line-through"}`}
                >
                  {item.day}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-600" /> Selected date</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-300" /> Not bookable</span>
      </div>
    </div>
  );
}
