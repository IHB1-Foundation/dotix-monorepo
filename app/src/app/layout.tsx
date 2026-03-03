import type { Metadata } from "next";

import { NavBar } from "@/components/NavBar";
import { NetworkGuard } from "@/components/NetworkGuard";
import { Providers } from "@/components/Providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Dotix",
  description: "Polkadot-native index vault",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="mx-auto max-w-6xl px-4 py-8">
            <NavBar />
            <NetworkGuard />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
