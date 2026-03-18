"use client";

import { useAccount, useDisconnect } from "wagmi";

import { Card } from "@/components/Card";
import { CopyableAddress } from "@/components/CopyableAddress";
import { PageHeader } from "@/components/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToggleGroup } from "@/components/ToggleGroup";
import { Button } from "@/components/Button";
import { usePreferences } from "@/hooks/usePreferences";
import { VAULT_ADDRESS, PDOT_ADDRESS, REGISTRY_ADDRESS } from "@/lib/contracts";
import { APP_CHAIN_ID, APP_EXPLORER_URL } from "@/lib/network";

const SLIPPAGE_OPTIONS = [
  { value: "0.1", label: "0.1%" },
  { value: "0.5", label: "0.5%" },
  { value: "1.0", label: "1.0%" },
];

export default function SettingsPage() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { prefs, updatePrefs } = usePreferences();

  return (
    <section className="mx-auto max-w-[560px] space-y-4">
      <PageHeader title="Settings" description="Manage your wallet, preferences, and app info." />

      {/* Wallet */}
      <Card padding="spacious">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Wallet
        </h2>
        {isConnected && address ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Connected address</p>
              <CopyableAddress address={address} short={false} className="mt-1 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Network</p>
              <p className="mt-1 text-sm font-medium text-ink dark:text-slate-100">
                {chain?.name ?? `Chain ${APP_CHAIN_ID}`}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => disconnect()}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No wallet connected.</p>
        )}
      </Card>

      {/* Preferences */}
      <Card padding="spacious">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Preferences
        </h2>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink dark:text-slate-100">Default Slippage</p>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Used as the default for Deposit &amp; Redeem forms.
            </p>
            <ToggleGroup
              items={SLIPPAGE_OPTIONS}
              value={prefs.defaultSlippage}
              onChange={(v) => updatePrefs({ defaultSlippage: v })}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink dark:text-slate-100">Theme</p>
            <ThemeToggle />
          </div>
        </div>
      </Card>

      {/* About */}
      <Card padding="spacious">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          About
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">App version</span>
            <span className="font-mono font-medium text-ink dark:text-slate-100">v0.0.1</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Chain ID</span>
            <span className="font-mono font-medium text-ink dark:text-slate-100">{APP_CHAIN_ID}</span>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Contract addresses</p>
            <div className="space-y-1">
              {[
                { label: "IndexVault", address: VAULT_ADDRESS },
                { label: "PDOT Token", address: PDOT_ADDRESS },
                { label: "Token Registry", address: REGISTRY_ADDRESS },
              ].map(({ label, address: addr }) => (
                <div key={addr} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                  <CopyableAddress address={addr} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`${APP_EXPLORER_URL}/address/${VAULT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-ocean underline hover:opacity-80"
            >
              Explorer
            </a>
            <a
              href="https://github.com/dotix"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-ocean underline hover:opacity-80"
            >
              GitHub
            </a>
          </div>
          <p className="pt-2 text-xs text-slate-400 dark:text-slate-500">
            ⚠ This is experimental software. Use at your own risk.
          </p>
        </div>
      </Card>
    </section>
  );
}
