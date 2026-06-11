import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = "https://mutualaid-seven.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: agencies }, { data: jobs }, { data: threads }] = await Promise.all([
    supabase.from("agencies").select("slug, created_at").order("review_count", { ascending: false }).limit(5000),
    supabase.from("jobs").select("id, created_at").eq("active", true).limit(1000),
    supabase.from("threads").select("id, created_at").order("created_at", { ascending: false }).limit(1000),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,              lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/agencies`, lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/forum`,    lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/jobs`,     lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/salary`,   lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/compare`,  lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/pricing`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/login`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/signup`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const agencyPages: MetadataRoute.Sitemap = (agencies ?? []).map((a) => ({
    url: `${BASE}/agencies/${a.slug}`,
    lastModified: new Date(a.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const jobPages: MetadataRoute.Sitemap = (jobs ?? []).map((j) => ({
    url: `${BASE}/jobs/${j.id}`,
    lastModified: new Date(j.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const threadPages: MetadataRoute.Sitemap = (threads ?? []).map((t) => ({
    url: `${BASE}/forum/${t.id}`,
    lastModified: new Date(t.created_at),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...agencyPages, ...jobPages, ...threadPages];
}
