import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/safety"],
      // Private areas must never be indexed.
      disallow: ["/app", "/auth", "/login", "/signup", "/forgot-password", "/reset-password"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
