"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
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
            className={`rounded-xl px-2 py-2 text-center text-xs font-semibold transition ${
              pathname?.startsWith(link.href) ? "bg-ocean text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
