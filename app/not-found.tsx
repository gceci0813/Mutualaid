import Link from "next/link";
import { Shield, Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-red-300" />
        </div>
        <p className="text-red-600 text-sm font-bold uppercase tracking-widest mb-2">404</p>
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="text-slate-500 mb-8">
          The page you&apos;re looking for may have been moved or removed — or the link was mistyped.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" />Back Home
          </Link>
          <Link href="/search" className="btn-secondary">
            <Search className="w-4 h-4" />Search MutualAid
          </Link>
        </div>
      </div>
    </div>
  );
}
