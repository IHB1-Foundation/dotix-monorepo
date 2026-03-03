"use client";

type Props = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function TxButton({ label, onClick, loading = false, disabled = false }: Props) {
  return (
    <button
      type="button"
      className="rounded-lg bg-ocean px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}
