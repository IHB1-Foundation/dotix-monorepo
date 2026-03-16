import dynamic from "next/dynamic";
import type { Metadata, Viewport } from "next";

import "./globals.css";

const AppShellClient = dynamic(() => import("@/components/AppShellClient").then((mod) => mod.AppShellClient), {
  ssr: false,
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
        <AppShellClient>{children}</AppShellClient>
      </body>
    </html>
  );
}
