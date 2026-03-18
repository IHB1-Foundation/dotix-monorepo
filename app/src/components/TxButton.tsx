"use client";

type Props = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger" | "secondary";
};

const variantClasses: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-ocean text-white hover:bg-[#0b65b3] active:bg-[#09528f] focus-visible:ring-ocean/40",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/40",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400/40",
};

export function TxButton({ label, onClick, loading = false, disabled = false, variant = "primary" }: Props) {
  return (
    <button
      type="button"
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}
