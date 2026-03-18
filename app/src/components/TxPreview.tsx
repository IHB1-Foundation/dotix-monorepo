"use client";

type PreviewItem = {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
};

type TxPreviewProps = {
  items: PreviewItem[];
  accent?: "ocean" | "warning";
};

const accentClasses = {
  ocean: {
    wrapper: "border-ocean/30 bg-ocean/5 dark:border-ocean/40 dark:bg-ocean/10",
    divider: "border-slate-200 dark:border-slate-700",
  },
  warning: {
    wrapper: "border-warning/30 bg-warning/5 dark:border-warning/40 dark:bg-warning/10",
    divider: "border-slate-200 dark:border-slate-700",
  },
};

export function TxPreview({ items, accent = "ocean" }: TxPreviewProps) {
  const cls = accentClasses[accent];

  return (
    <div className={`mt-3 rounded-lg border p-3 text-sm ${cls.wrapper}`}>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Transaction Preview
      </p>
      <div className="space-y-1 text-slate-700 dark:text-slate-200">
        {items.map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className={`flex justify-between ${item.muted ? `border-t ${cls.divider} pt-1` : ""}`}
          >
            <span className={item.muted ? "text-slate-500 dark:text-slate-400" : ""}>{item.label}</span>
            <span
              className={`tabular-nums ${
                item.highlight
                  ? "text-base font-bold text-ink dark:text-slate-100"
                  : item.muted
                    ? "text-slate-600 dark:text-slate-300"
                    : "font-medium"
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
