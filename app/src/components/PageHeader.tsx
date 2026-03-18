"use client";

import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-slate-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
