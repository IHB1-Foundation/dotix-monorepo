"use client";

type AllocationItem = {
  label: string;
  value: number;
  color: string;
};

type AllocationChartProps = {
  items: AllocationItem[];
  totalLabel: string;
};

const CHART_COLORS = ["#0f7ad8", "#20c997", "#f59f00", "#f97316", "#a855f7", "#ef4444"];

export function allocationColorByIndex(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function AllocationChart({ items, totalLabel }: AllocationChartProps) {
  const positiveItems = items.filter((item) => item.value > 0);
  const total = positiveItems.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  const legend = (
    <ul className="space-y-1.5 text-sm">
      {positiveItems.map((item) => (
        <li key={`legend-${item.label}`} className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
          <span className="tabular-nums text-slate-600 dark:text-slate-300">{((item.value / total) * 100).toFixed(2)}%</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Allocation</h3>
      {total <= 0 ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No asset value available for charting.</p>
      ) : (
        <>
          {/* Mobile: mini donut + legend stacked */}
          <div className="mt-4 flex flex-col items-center gap-4 md:hidden">
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                <circle cx="70" cy="70" r={radius} strokeWidth={strokeWidth} className="fill-none stroke-slate-200 dark:stroke-slate-700" />
                {positiveItems.map((item) => {
                  const ratio = item.value / total;
                  const dash = circumference * ratio;
                  const offset = circumference * (1 - accumulated);
                  accumulated += ratio;

                  return (
                    <circle
                      key={item.label}
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={offset}
                      strokeLinecap="butt"
                    />
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">NAV</p>
                <p className="mt-0.5 text-xs font-bold text-ink dark:text-slate-100">{totalLabel}</p>
              </div>
            </div>
            {legend}
          </div>

          {/* Desktop: side-by-side */}
          <div className="mt-4 hidden grid-cols-[auto_1fr] items-center gap-6 md:grid">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                <circle cx="70" cy="70" r={radius} strokeWidth={strokeWidth} className="fill-none stroke-slate-200 dark:stroke-slate-700" />
                {(() => {
                  let acc2 = 0;
                  return positiveItems.map((item) => {
                    const ratio = item.value / total;
                    const dash = circumference * ratio;
                    const offset = circumference * (1 - acc2);
                    acc2 += ratio;

                    return (
                      <circle
                        key={item.label}
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={offset}
                        strokeLinecap="butt"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Total NAV</p>
                <p className="mt-1 text-sm font-bold text-ink dark:text-slate-100">{totalLabel}</p>
              </div>
            </div>
            {legend}
          </div>
        </>
      )}
    </div>
  );
}
