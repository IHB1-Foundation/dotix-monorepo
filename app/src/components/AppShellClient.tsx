"use client";

import { ReactNode } from "react";

import { NavBar } from "@/components/NavBar";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Providers } from "@/components/Providers";

export function AppShellClient({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <NavBar />
        <NetworkGuard />
        {children}
      </main>
    </Providers>
  );
}
