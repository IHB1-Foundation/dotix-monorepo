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
      <div className="relative h-2.5 min-w-[12rem] w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${deviationColor}`} style={{ width: `${currentPct}%` }} />
        <div
          className="absolute top-0 h-full border-l-2 border-dashed border-slate-900/70"
          style={{ left: `${targetPct}%` }}
        />
      </div>
      <p className="text-xs text-slate-600">
        current {currentPct.toFixed(2)}% / target {targetPct.toFixed(2)}% / deviation {(deviation / 100).toFixed(2)}%
      </p>
    </div>
  );
}
