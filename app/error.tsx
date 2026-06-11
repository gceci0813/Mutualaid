"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-slate-500 mb-8">
          An unexpected error occurred. Your data is safe — try the page again, and if it keeps
          happening, head back home.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={reset} className="btn-primary">
            <RotateCcw className="w-4 h-4" />Try Again
          </button>
          <Link href="/" className="btn-secondary">
            <Home className="w-4 h-4" />Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
