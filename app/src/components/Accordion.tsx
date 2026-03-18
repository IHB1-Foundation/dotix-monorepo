"use client";

import { ReactNode, useState } from "react";

type AccordionItem = {
  title: string;
  content: ReactNode;
};

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <article key={item.title} className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              {item.title}
              <span className="text-xs text-slate-500 dark:text-slate-400">{isOpen ? "Hide" : "Show"}</span>
            </button>
            {isOpen ? <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.content}</div> : null}
          </article>
        );
      })}
    </div>
  );
}
