"use client";

export type ToastVariant = "success" | "error" | "tx-pending" | "tx-confirmed";

type ToastProps = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  linkHref?: string;
  linkLabel?: string;
  onClose: (id: string) => void;
};

export function Toast({ id, variant, title, description, linkHref, linkLabel, onClose }: ToastProps) {
  const isSuccess = variant === "success";
  const isPending = variant === "tx-pending";
  const isConfirmed = variant === "tx-confirmed";
  const isError = variant === "error";

  const wrapperClass = isSuccess || isConfirmed
    ? "border-mint/40 bg-mint/15 text-emerald-900 dark:text-mint-light"
    : isPending
      ? "border-ocean/40 bg-ocean/10 text-ocean dark:text-blue-300"
      : "border-error/40 bg-error-light text-error-dark dark:bg-error/20 dark:text-error dark:border-error/30";

  return (
    <div
      className={`w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition ${wrapperClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {isPending && (
            <svg className="h-5 w-5 animate-spin text-ocean" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
            </svg>
          )}
          {(isSuccess || isConfirmed) && (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-mint" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
          {isError && (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-error" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 1.8 18.5A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.8-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {description ? <p className="mt-1 text-xs leading-relaxed">{description}</p> : null}
          {linkHref && linkLabel ? (
            <a className="mt-2 inline-flex text-xs font-medium underline" href={linkHref} target="_blank" rel="noreferrer">
              {linkLabel}
            </a>
          ) : null}
        </div>
        {!isPending && (
          <button
            type="button"
            aria-label="Close toast"
            onClick={() => onClose(id)}
            className="rounded-md px-1 text-xs font-semibold opacity-70 transition hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
