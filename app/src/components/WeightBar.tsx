"use client";

type Props = {
  currentBps: number;
  targetBps: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function WeightBar({ currentBps, targetBps }: Props) {
  const currentPct = clamp(currentBps / 100, 0, 100);
  const targetPct = clamp(targetBps / 100, 0, 100);
  const deviation = Math.abs(currentBps - targetBps);

  const deviationColor = deviation > 1000 ? "bg-red-500" : deviation > 500 ? "bg-warning" : "bg-mint";

  return (
    <div className="min-w-0 space-y-2">
      <div
        className="relative min-w-[12rem] pt-4"
        title={`Current ${currentPct.toFixed(2)}%, Target ${targetPct.toFixed(2)}%, Deviation ${(deviation / 100).toFixed(2)}%`}
      >
        <span
          className="absolute left-0 top-0 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
          style={{ left: `${targetPct}%` }}
        >
          Target
        </span>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full ${deviationColor}`} style={{ width: `${currentPct}%` }} />
          <div
            className="absolute top-0 h-full border-l-2 border-dashed border-slate-900/70"
            style={{ left: `${targetPct}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        current {currentPct.toFixed(2)}% / target {targetPct.toFixed(2)}% / deviation {(deviation / 100).toFixed(2)}%
      </p>
    </div>
  );
}
