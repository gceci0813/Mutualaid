import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/agencies", "/forum", "/jobs", "/salary", "/compare", "/pricing"],
        disallow: ["/dashboard", "/api", "/auth", "/admin"],
      },
    ],
    sitemap: "https://mutualaid-seven.vercel.app/sitemap.xml",
    host: "https://mutualaid-seven.vercel.app",
  };
}
