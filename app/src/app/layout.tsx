import dynamic from "next/dynamic";
import type { Metadata } from "next";

import "./globals.css";

const AppShellClient = dynamic(() => import("@/components/AppShellClient").then((mod) => mod.AppShellClient), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Dotix",
  description: "Polkadot-native index vault",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShellClient>{children}</AppShellClient>
      </body>
    </html>
  );
}
