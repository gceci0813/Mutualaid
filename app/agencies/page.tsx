import { Suspense } from "react";
import AgenciesBrowser from "./AgenciesBrowser";
import type { Metadata } from "next";
import { Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Browse Agencies",
  description: "Search and browse police, fire, EMS, and public safety agencies across the United States.",
};

export default function AgenciesPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Agency Search</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">Browse Agencies</h1>
          <p className="text-slate-500 text-lg max-w-xl">
            Search 66,000+ public safety agencies across the United States. See ratings, reviews, and open positions.
          </p>
        </div>
      </div>

      <div className="page-container py-10">
        <Suspense fallback={
          <div className="space-y-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        }>
          <AgenciesBrowser />
        </Suspense>
      </div>
    </>
  );
}
