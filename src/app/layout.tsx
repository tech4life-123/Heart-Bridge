import type { Metadata, Viewport } from "next";
import { APP } from "@/config/app";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP.name}: ${APP.tagline}`,
    template: `%s | ${APP.name}`,
  },
  description: APP.description,
  applicationName: APP.name,
  openGraph: {
    type: "website",
    siteName: APP.name,
    title: `${APP.name}: ${APP.tagline}`,
    description: APP.description,
  },
  twitter: {
    card: "summary",
    title: `${APP.name}: ${APP.tagline}`,
    description: APP.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#C93A5B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
