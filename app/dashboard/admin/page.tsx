"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Copy, Check, RefreshCw, Search, ChevronDown } from "lucide-react";

interface Agency {
  id: string;
  name: string;
  city: string;
  state_abbr: string;
  discipline: string;
}

interface AccessCode {
  id: string;
  code: string;
  used_by_user_id: string | null;
  used_at: string | null;
  created_at: string;
}

export default function AdminCodesPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [agencySearch, setAgencySearch] = useState("");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [existingCodes, setExistingCodes] = useState<AccessCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Check admin access on mount
  useEffect(() => {
    fetch("/api/admin/codes?agencyId=check-auth")
      .then((r) => {
        if (r.status === 403) setAuthorized(false);
        else setAuthorized(true); // 400 = missing agencyId is fine, means auth passed
      })
      .catch(() => setAuthorized(false));
  }, []);

  // Agency search
  useEffect(() => {
    if (agencySearch.length < 2) { setAgencies([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/agencies?q=${encodeURIComponent(agencySearch)}`);
      if (res.ok) setAgencies(await res.json());
    }, 300);
    return () => clearTimeout(t);
  }, [agencySearch]);

  const loadCodes = useCallback(async (agencyId: string) => {
    setLoadingCodes(true);
    const res = await fetch(`/api/admin/codes?agencyId=${agencyId}`);
    if (res.ok) {
      const data = await res.json();
      setExistingCodes(data.codes);
    }
    setLoadingCodes(false);
  }, []);

  function selectAgency(agency: Agency) {
    setSelectedAgency(agency);
    setAgencySearch(agency.name);
    setShowDropdown(false);
    setNewCodes([]);
    loadCodes(agency.id);
  }

  async function handleGenerate() {
    if (!selectedAgency) return;
    setGenerating(true);
    const res = await fetch("/api/admin/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId: selectedAgency.id, count }),
    });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      setNewCodes(data.codes);
      loadCodes(selectedAgency.id);
    }
  }

  async function copyAll() {
    await navigator.clipboard.writeText(newCodes.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  const used = existingCodes.filter((c) => c.used_by_user_id).length;
  const unused = existingCodes.filter((c) => !c.used_by_user_id).length;

  if (authorized === null) {
    return (
      <div className="page-container py-10 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="page-container py-10 max-w-lg text-center">
        <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm">This page is for administrators only.</p>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Officer Verification Codes</h1>
          <p className="text-sm text-slate-500">Generate one-time codes for agency contacts to distribute to their officers</p>
        </div>
      </div>

      {/* Agency selector */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Select Agency</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-10 pr-8"
            placeholder="Search agencies by name..."
            value={agencySearch}
            onChange={(e) => { setAgencySearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => agencySearch.length >= 2 && setShowDropdown(true)}
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          {showDropdown && agencies.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {agencies.map((a) => (
                <button
                  key={a.id}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between gap-3"
                  onClick={() => selectAgency(a)}
                >
                  <span className="text-sm font-medium text-slate-900 truncate">{a.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{a.city}, {a.state_abbr}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedAgency && (
          <div className="mt-3 flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
            <span className="text-sm font-semibold text-red-700">{selectedAgency.name}</span>
            <span className="text-xs text-red-500">{selectedAgency.city}, {selectedAgency.state_abbr}</span>
          </div>
        )}
      </div>

      {/* Code generation */}
      {selectedAgency && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">Generate Codes</h2>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{existingCodes.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total issued</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{used}</p>
              <p className="text-xs text-green-600 mt-0.5">Redeemed</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{unused}</p>
              <p className="text-xs text-amber-600 mt-0.5">Unused</p>
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label" htmlFor="count">Number of codes</label>
              <input
                id="count"
                type="number"
                min={1}
                max={100}
                className="input"
                value={count}
                onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
              />
            </div>
            <button
              className="btn-primary py-3 px-6 shrink-0"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Generate"
              )}
            </button>
          </div>

          {/* New codes output */}
          {newCodes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">
                  {newCodes.length} new code{newCodes.length !== 1 ? "s" : ""} — copy and send to {selectedAgency.name}
                </p>
                <button
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
                  onClick={copyAll}
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedAll ? "Copied!" : "Copy all"}
                </button>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 max-h-52 overflow-y-auto space-y-1">
                {newCodes.map((c) => (
                  <div key={c}>{c}</div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Each code is single-use. Send via your department&apos;s internal communications.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Code history */}
      {selectedAgency && existingCodes.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Code History</h2>
            <button
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              onClick={() => loadCodes(selectedAgency.id)}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          {loadingCodes ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-2 text-xs text-slate-500 font-medium">Code</th>
                    <th className="pb-2 text-xs text-slate-500 font-medium">Status</th>
                    <th className="pb-2 text-xs text-slate-500 font-medium">Redeemed</th>
                    <th className="pb-2 text-xs text-slate-500 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {existingCodes.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 font-mono text-xs text-slate-700">{c.code}</td>
                      <td className="py-2.5">
                        <span className={`badge text-xs ${c.used_by_user_id ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                          {c.used_by_user_id ? "Redeemed" : "Unused"}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-slate-400">
                        {c.used_at ? new Date(c.used_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2.5 text-xs text-slate-400">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
