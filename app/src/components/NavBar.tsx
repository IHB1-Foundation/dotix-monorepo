"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/deposit", label: "Deposit", icon: "deposit" },
  { href: "/autopilot", label: "Autopilot", icon: "autopilot" },
  { href: "/xcm", label: "XCM Demo", icon: "xcm" },
] as const;

function NavIcon({ type }: { type: (typeof links)[number]["icon"] }): ReactNode {
  if (type === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (type === "deposit") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v14" />
        <path d="m7 12 5 5 5-5" />
        <rect x="4" y="19" width="16" height="2" rx="1" />
      </svg>
    );
  }

  if (type === "autopilot") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="6" y="7" width="12" height="10" rx="3" />
        <path d="M9 12h.01M15 12h.01" />
        <path d="M12 2v3M5 9H3m18 0h-2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.4 10.8 7.2-3.6m-7.2 6.4 7.2 3.6" />
    </svg>
  );
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start justify-between gap-4">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <Image
                src="/dotix-logo.svg"
                alt="Dotix logo"
                width={48}
                height={48}
                priority
                className="h-12 w-12 rounded-2xl shadow-sm ring-1 ring-slate-200/80 transition-transform group-hover:scale-[1.03]"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Polkadot Native</p>
                <h1 className="text-xl font-bold tracking-tight text-ink">Dotix</h1>
                <p className="text-xs text-slate-500">Index Vault</p>
              </div>
            </Link>
            <div className="lg:hidden">
              <ConnectButton />
            </div>
          </div>
          <nav className="hidden flex-wrap items-center gap-2 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname?.startsWith(link.href)
                    ? "bg-ocean text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:block">
            <ConnectButton />
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-[11px] font-semibold transition ${
              pathname?.startsWith(link.href) ? "bg-ocean text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span aria-hidden="true">
              <NavIcon type={link.icon} />
            </span>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
