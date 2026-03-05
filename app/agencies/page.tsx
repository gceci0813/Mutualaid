import { Suspense } from "react";
import AgenciesBrowser from "./AgenciesBrowser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Agencies",
  description: "Search and browse police, fire, EMS, and public safety agencies across the United States.",
};

export default function AgenciesPage() {
  return (
    <div className="page-container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse Agencies</h1>
        <p className="text-slate-500">
          Search 66,000+ public safety agencies across the United States. See ratings, reviews, and open positions.
        </p>
      </div>
      <Suspense fallback={<div className="animate-pulse text-slate-400">Loading agencies...</div>}>
        <AgenciesBrowser />
      </Suspense>
    </div>
  );
}
