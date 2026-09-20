export function CustomQuoteBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-amber-900 ${className}`}
    >
      Custom quote needed
    </span>
  );
}
