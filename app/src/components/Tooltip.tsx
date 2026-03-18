"use client";

import { ReactNode, useState } from "react";

type Props = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span className="cursor-help border-b border-dashed border-slate-400 dark:border-slate-500">
        {children}
      </span>
      {visible && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-max max-w-xs -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 shadow-lg dark:bg-slate-700"
        >
          {content}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
        </span>
      )}
    </span>
  );
}
