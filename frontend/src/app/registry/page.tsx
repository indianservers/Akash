"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface RegistryResult {
  certificate_id: string;
  share_slug: string;
  star_name: string;
  common_name?: string;
  constellation?: string;
  star_type?: string;
  magnitude?: number;
  dedication_type?: string;
  recipient_name?: string;
  approved_at?: string;
  expiry_date?: string;
  status: string;
  share_url: string;
}

export default function RegistryPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get("/registry/search", { params: { q: q || undefined } });
      setResults(res.data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search("");
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      <div className="sticky top-0 z-20 bg-space-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-white/50 text-sm">← Home</Link>
        <h1 className="font-bold">Star Registry</h1>
        <Link href="/ar" className="text-star-blue text-sm">AR View</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-white/50 text-sm mb-6 text-center">
          Search the registry of named stars. Find a star by name, certificate ID, or recipient.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by star name, certificate ID, recipient..."
            className="form-input flex-1"
          />
          <button type="submit" className="btn-primary px-5 py-3">
            🔍
          </button>
        </form>

        {/* Results */}
        {loading ? (
          <div className="text-white/40 text-center py-12">Searching the stars...</div>
        ) : results.length === 0 && searched ? (
          <div className="glass-panel p-10 text-center">
            <div className="text-3xl mb-3">🌑</div>
            <p className="text-white/50">No named stars found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r, i) => (
              <motion.div
                key={r.certificate_id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-star-white text-lg">⭐ {r.star_name}</h3>
                    {r.common_name && <p className="text-star-blue text-sm">({r.common_name})</p>}
                    <p className="text-white/40 text-xs mt-1">
                      {r.constellation} · {r.star_type}
                      {r.magnitude !== undefined && ` · Mag ${r.magnitude}`}
                    </p>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-lg">
                    {r.status}
                  </span>
                </div>

                {r.dedication_type && (
                  <p className="text-sm text-white/60 mt-2">{r.dedication_type}</p>
                )}
                {r.recipient_name && (
                  <p className="text-sm text-white/50 mt-0.5">For: {r.recipient_name}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="text-xs text-white/30">
                    {r.approved_at && `Registered: ${formatDate(r.approved_at)}`}
                    {r.expiry_date && ` · Expires: ${formatDate(r.expiry_date)}`}
                  </div>
                  <Link
                    href={r.share_url}
                    className="text-star-blue text-xs font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
