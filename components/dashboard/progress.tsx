export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-mist-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-blue transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {done} of {total} lessons · {pct}%
      </p>
    </div>
  );
}
