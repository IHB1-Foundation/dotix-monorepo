"use client";

export function ExplanationPanel({ lines }: { lines: string[] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Explanation</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {lines.map((line, idx) => (
          <li key={`${idx}-${line}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
