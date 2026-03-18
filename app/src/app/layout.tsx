import dynamic from "next/dynamic";
import type { Metadata, Viewport } from "next";

import "./globals.css";
import { ShellSkeleton } from "@/components/ShellSkeleton";

const AppShellClient = dynamic(() => import("@/components/AppShellClient").then((mod) => mod.AppShellClient), {
  ssr: false,
  loading: () => <ShellSkeleton />,
});

export const metadata: Metadata = {
  title: "Dotix",
  description: "Polkadot-native index vault",
  applicationName: "Dotix",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/dotix-logo.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f7ad8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ocean focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <AppShellClient>{children}</AppShellClient>
      </body>
    </html>
  );
}
