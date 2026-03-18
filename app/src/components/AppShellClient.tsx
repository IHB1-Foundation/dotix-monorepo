"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { NavBar } from "@/components/NavBar";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Providers } from "@/components/Providers";

export function AppShellClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Providers>
      <NavBar />
      <div className="flex min-h-[calc(100vh-60px)] flex-col">
        <div className="flex flex-1">
          <Sidebar />
          <main id="main-content" className="min-w-0 flex-1 px-4 py-6 pb-28 md:pb-8 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <NetworkGuard />
              <div key={pathname} className="page-transition">
                {children}
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </Providers>
  );
}
