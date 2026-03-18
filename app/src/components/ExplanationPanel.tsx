"use client";

function lineIcon(line: string): string {
  const l = line.toLowerCase();
  if (l.includes("liquidit") || l.includes("reserv") || l.includes("pool")) return "📊";
  if (l.includes("slippage") || l.includes("%")) return "📉";
  if (l.includes("cap") || l.includes("limit") || l.includes("guard") || l.includes("cool")) return "🛡";
  if (l.includes("swap") || l.includes("trade")) return "🔄";
  if (l.includes("weight") || l.includes("target") || l.includes("bps")) return "⚖";
  return "•";
}

export function ExplanationPanel({ lines }: { lines: string[] }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ocean/10 text-ocean">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Agent Decision Trace</h3>
      </div>
      {lines.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Generate a plan to see agent reasoning.</p>
      ) : (
        <div className="border-l-2 border-ocean/30 pl-3 dark:border-ocean/50">
          <ul className="space-y-2">
            {lines.map((line, idx) => (
              <li key={`${idx}-${line}`} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="mt-0.5 shrink-0 text-base leading-none">{lineIcon(line)}</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
