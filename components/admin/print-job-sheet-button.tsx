"use client";

export function PrintJobSheetButton() {
  return (
    <button type="button" onClick={() => window.print()} className="button button-primary w-full sm:w-auto">
      Print Job Sheet
    </button>
  );
}
