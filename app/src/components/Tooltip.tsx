"use client";

import { ReactNode, useRef, useState, useCallback, useEffect } from "react";

type Props = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: Props) {
  const [visible, setVisible] = useState(false);
  const tipRef = useRef<HTMLSpanElement>(null);

  const clamp = useCallback(() => {
    const el = tipRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // reset
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";

    const updated = el.getBoundingClientRect();
    if (updated.left < 8) {
      el.style.left = "0";
      el.style.transform = "translateX(0)";
    } else if (updated.right > window.innerWidth - 8) {
      el.style.left = "auto";
      el.style.right = "0";
      el.style.transform = "translateX(0)";
    }
  }, []);

  useEffect(() => {
    if (visible) clamp();
  }, [visible, clamp]);

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
          ref={tipRef}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-max max-w-[min(20rem,calc(100vw-1rem))] -translate-x-1/2 whitespace-normal break-words rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs leading-relaxed text-slate-100 shadow-lg dark:bg-slate-700"
        >
          {content}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
        </span>
      )}
    </span>
  );
}
