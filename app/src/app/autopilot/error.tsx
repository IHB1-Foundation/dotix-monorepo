"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AutopilotError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[Autopilot]", error);
  }, [error]);

  return (
    <section className="space-y-4">
      <PageHeader title="Autopilot" description="Generate plans, apply targets, and execute rebalances." />
      <Card>
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold text-error">Something went wrong</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {error.message || "An unexpected error occurred while loading the Autopilot page."}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </Card>
    </section>
  );
}
