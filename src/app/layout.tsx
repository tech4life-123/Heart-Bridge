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
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: APP.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP.name}: ${APP.tagline}`,
    description: APP.description,
    images: ["/brand/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
