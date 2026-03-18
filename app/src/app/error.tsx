"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4 py-16">
      <div className="card w-full p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Application Error</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          This may be caused by a network issue, an unsupported browser extension, or temporary chain instability.
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Try refreshing, reconnecting your wallet, or returning to the dashboard.</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          <a href="https://status.polkadot.network/" target="_blank" rel="noreferrer" className="underline">
            Check Polkadot network status
          </a>
        </p>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="text-xs font-semibold text-slate-600 underline dark:text-slate-300"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>
          {showDetails ? (
            <div className="mt-3 rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <p>{error.message || "An unexpected render error interrupted the current view."}</p>
              {error.digest ? <p className="mt-2 opacity-80">Digest: {error.digest}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
