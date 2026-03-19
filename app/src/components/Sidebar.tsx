"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/deposit", label: "Deposit", icon: "deposit" },
  { href: "/autopilot", label: "Autopilot", icon: "autopilot" },
] as const;

const advancedLinks = [
  { href: "/xcm", label: "Cross-Chain Messaging", shortLabel: "XCM", icon: "xcm" },
] as const;

function SidebarIcon({ type }: { type: string }): ReactNode {
  if (type === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (type === "deposit") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v14" />
        <path d="m7 12 5 5 5-5" />
        <rect x="4" y="19" width="16" height="2" rx="1" />
      </svg>
    );
  }
  if (type === "autopilot") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="6" y="7" width="12" height="10" rx="3" />
        <path d="M9 12h.01M15 12h.01" />
        <path d="M12 2v3M5 9H3m18 0h-2" />
      </svg>
    );
  }
  // xcm
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.4 10.8 7.2-3.6m-7.2 6.4 7.2 3.6" />
    </svg>
  );
}

function NavItem({
  href,
  label,
  shortLabel,
  icon,
  isActive,
}: {
  href: string;
  label: string;
  shortLabel?: string;
  icon: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-ocean/10 text-ocean dark:bg-ocean/20 dark:text-ocean-light"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      }`}
    >
      {/* Active accent bar */}
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-ocean" />
      )}

      <SidebarIcon type={icon} />

      {/* Full label on lg */}
      <span className="hidden lg:block">{label}</span>
      {shortLabel && <span className="hidden md:block lg:hidden">{shortLabel}</span>}

      {/* Tooltip for md icon-only mode */}
      <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 md:block lg:hidden dark:bg-slate-700">
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-16 shrink-0 flex-col border-r border-slate-200 bg-white md:flex lg:w-60 dark:border-slate-800 dark:bg-surface-1">
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {mainLinks.map((link) => (
            <li key={link.href}>
              <NavItem
                href={link.href}
                label={link.label}
                icon={link.icon}
                isActive={!!pathname?.startsWith(link.href)}
              />
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <div className="my-1 mx-3 h-px bg-slate-100 dark:bg-slate-800" />
          <ul className="space-y-1">
            {advancedLinks.map((link) => (
              <li key={link.href}>
                <NavItem
                  href={link.href}
                  label={link.label}
                  shortLabel={link.shortLabel}
                  icon={link.icon}
                  isActive={!!pathname?.startsWith(link.href)}
                />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-slate-100 px-2 py-3 dark:border-slate-800">
        <Link
          href="/settings"
          className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname?.startsWith("/settings")
              ? "bg-ocean/10 text-ocean dark:bg-ocean/20 dark:text-ocean-light"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          }`}
        >
          {pathname?.startsWith("/settings") && (
            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-ocean" />
          )}
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="hidden lg:block">Settings</span>
          <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 md:block lg:hidden dark:bg-slate-700">
            Settings
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
          </span>
        </Link>
      </div>
    </aside>
  );
}
