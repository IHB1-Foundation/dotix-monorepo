"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { NavBar } from "@/components/NavBar";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Providers } from "@/components/Providers";

export function AppShellClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Providers>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:py-8 md:pb-8">
        <NetworkGuard />
        <div key={pathname} className="page-transition">
          {children}
        </div>
      </main>
    </Providers>
  );
}
