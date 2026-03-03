"use client";

type Props = {
  hash?: string;
  isPending?: boolean;
  isConfirmed?: boolean;
  error?: string;
};

export function TxStatus({ hash, isPending, isConfirmed, error }: Props) {
  if (!hash && !error) {
    return null;
  }

  const link = hash ? `https://blockscout-testnet.polkadot.io/tx/${hash}` : undefined;

  return (
    <div className="mt-2 text-sm">
      {isPending && <p className="text-slate-600">Transaction submitted...</p>}
      {isConfirmed && (
        <p className="text-mint">
          Confirmed! {link ? <a className="underline" href={link} target="_blank" rel="noreferrer">View on Blockscout</a> : null}
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}
      {!isPending && !isConfirmed && hash && link && (
        <p>
          <a className="underline text-slate-600" href={link} target="_blank" rel="noreferrer">
            View transaction
          </a>
        </p>
      )}
    </div>
  );
}
