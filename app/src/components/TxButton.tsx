"use client";

import { Button, ButtonVariant } from "./Button";

type Props = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
};

export function TxButton({ label, onClick, loading = false, disabled = false, variant = "primary" }: Props) {
  return (
    <Button variant={variant} onClick={onClick} loading={loading} disabled={disabled}>
      {label}
    </Button>
  );
}
