"use client";

type ToastProps = {
  id: string;
  variant: "success" | "error";
  title: string;
  description?: string;
  linkHref?: string;
  linkLabel?: string;
  onClose: (id: string) => void;
};

export function Toast({ id, variant, title, description, linkHref, linkLabel, onClose }: ToastProps) {
  const isSuccess = variant === "success";

  return (
    <div
      className={`w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition ${
        isSuccess ? "border-mint/40 bg-mint/15 text-emerald-900" : "border-red-300 bg-red-50 text-red-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {isSuccess ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-mint" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2">
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
        <button
          type="button"
          aria-label="Close toast"
          onClick={() => onClose(id)}
          className="rounded-md px-1 text-xs font-semibold opacity-70 transition hover:opacity-100"
        >
          x
        </button>
      </div>
    </div>
  );
}
