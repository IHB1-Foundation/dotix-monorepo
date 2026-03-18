"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: Props) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!visible || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2,
    });
  }, [visible]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span className="cursor-help border-b border-dashed border-slate-400 dark:border-slate-500">
        {children}
      </span>
      {visible &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: pos.top, left: pos.left }}
            className="pointer-events-none fixed z-[9999] w-max max-w-[min(20rem,calc(100vw-1rem))] -translate-x-1/2 -translate-y-full whitespace-normal break-words rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs leading-relaxed text-slate-100 shadow-lg dark:bg-slate-700"
          >
            <span className="-mt-1 block pb-1">{content}</span>
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
          </span>,
          document.body
        )}
    </span>
  );
}
