"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4 py-16">
      <div className="card w-full p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Application Error</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate-600">
          {error.message || "An unexpected render error interrupted the current view."}
        </p>
        {error.digest ? <p className="mt-2 text-xs text-slate-400">Digest: {error.digest}</p> : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
