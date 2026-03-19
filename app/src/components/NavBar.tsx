"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Dashboard", icon: "dashboard" },
  { href: "/deposit", label: "Deposit", mobileLabel: "Deposit", icon: "deposit" },
  { href: "/autopilot", label: "Autopilot", mobileLabel: "Autopilot", icon: "autopilot" },
  { href: "/xcm", label: "XCM", mobileLabel: "XCM", icon: "xcm" },
] as const;

function NavIcon({ type }: { type: (typeof links)[number]["icon"] }): ReactNode {
  if (type === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (type === "deposit") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v14" />
        <path d="m7 12 5 5 5-5" />
        <rect x="4" y="19" width="16" height="2" rx="1" />
      </svg>
    );
  }

  if (type === "autopilot") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="6" y="7" width="12" height="10" rx="3" />
        <path d="M9 12h.01M15 12h.01" />
        <path d="M12 2v3M5 9H3m18 0h-2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      {/* Full-width sticky GNB */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-surface-1">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <Image
              src="/dotix-logo.svg"
              alt="Dotix logo"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-xl shadow-sm transition-transform group-hover:scale-[1.03]"
            />
            <span className="font-display text-base font-bold tracking-tight text-ink dark:text-slate-100">Dotix</span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      {/* Mobile bottom nav — hidden on md+ (sidebar takes over) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 z-40 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-surface-1 md:hidden"
        style={{ bottom: 0, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {links.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-center text-[11px] font-semibold transition-all active:scale-95 ${
                isActive
                  ? "bg-ocean/8 text-ocean dark:text-ocean-light"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-ocean dark:bg-ocean-light" />
              )}
              <span aria-hidden="true">
                <NavIcon type={link.icon} />
              </span>
              {link.mobileLabel}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
