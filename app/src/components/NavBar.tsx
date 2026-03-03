"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/deposit", label: "Deposit" },
  { href: "/autopilot", label: "Autopilot" },
  { href: "/xcm", label: "XCM Demo" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dotix</h1>
        <p className="text-xs text-slate-500">Polkadot-Native Index Vault</p>
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname?.startsWith(link.href) ? "bg-ocean text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <ConnectButton />
    </header>
  );
}
