"use client";

type Step = {
  label: string;
  detail?: string;
  completed?: boolean;
  active?: boolean;
  locked?: boolean;
};

const colClass: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

export function Stepper({ steps }: { steps: Step[] }) {
  const cols = colClass[steps.length] ?? "sm:grid-cols-3";
  return (
    <ol className={`card grid gap-2 p-3 ${cols}`}>
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={`rounded-lg border px-3 py-2 text-sm ${
            step.completed
              ? "border-mint/40 bg-mint/10 text-emerald-800 dark:text-emerald-300"
              : step.active
                ? "border-ocean/40 bg-ocean/10 text-ocean dark:text-blue-300"
                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
          }`}
        >
          <p className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
              {step.completed ? "OK" : index + 1}
            </span>
            {step.label}
            {step.locked ? (
              <span title="Role required">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                </svg>
              </span>
            ) : null}
          </p>
          {step.detail ? <p className="mt-1 text-xs opacity-80">{step.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}
