"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Metrics {
  total_stars: number;
  available_stars: number;
  named_stars: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  expired_names: number;
  expiring_in_30_days: number;
  total_users: number;
}

function MetricCard({ label, value, color = "text-star-white" }: { label: string; value: number; color?: string }) {
  return (
    <div className="glass-panel p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-white/40 text-xs mt-1">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login?redirect=/admin"); return; }
    if (user?.role !== "Admin" && user?.role !== "SuperAdmin") { router.push("/dashboard"); return; }
    api.get("/admin/dashboard/metrics").then((res) => setMetrics(res.data)).finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const processExpired = async () => {
    setProcessing(true);
    try {
      const res = await api.post("/admin/process-expired-names");
      alert(res.data.detail);
      const m = await api.get("/admin/dashboard/metrics");
      setMetrics(m.data);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-space-950 flex items-center justify-center"><div className="text-4xl animate-spin-slow">✨</div></div>;
  }

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      <div className="sticky top-0 z-20 bg-space-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-white/50 text-sm">← Site</Link>
        <h1 className="font-bold">Admin Dashboard</h1>
        <span className="text-white/30 text-xs">{user?.role}</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Nav */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/admin/requests", label: "Naming Requests", icon: "📋", badge: metrics?.pending_requests },
            { href: "/admin/stars", label: "Star Management", icon: "⭐" },
            { href: "/admin/users", label: "Users", icon: "👥" },
            { href: "/registry", label: "Public Registry", icon: "🌐" },
          ].map((nav) => (
            <Link key={nav.href} href={nav.href} className="glass-panel p-4 flex items-center gap-3 hover:border-star-blue/30 transition-colors">
              <span className="text-2xl">{nav.icon}</span>
              <div>
                <div className="font-medium text-sm">{nav.label}</div>
                {nav.badge !== undefined && nav.badge > 0 && (
                  <div className="text-yellow-400 text-xs">{nav.badge} pending</div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Metrics */}
        {metrics && (
          <>
            <h2 className="font-semibold">Overview</h2>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Total Stars" value={metrics.total_stars} color="text-star-blue" />
              <MetricCard label="Available" value={metrics.available_stars} color="text-green-400" />
              <MetricCard label="Named" value={metrics.named_stars} color="text-star-gold" />
              <MetricCard label="Pending" value={metrics.pending_requests} color="text-yellow-400" />
              <MetricCard label="Approved" value={metrics.approved_requests} color="text-green-400" />
              <MetricCard label="Expired" value={metrics.expired_names} color="text-white/40" />
              <MetricCard label="Expiring Soon" value={metrics.expiring_in_30_days} color="text-orange-400" />
              <MetricCard label="Rejected" value={metrics.rejected_requests} color="text-red-400" />
              <MetricCard label="Users" value={metrics.total_users} color="text-star-blue" />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <h2 className="font-semibold">Admin Actions</h2>
          <button
            onClick={processExpired}
            disabled={processing}
            className="w-full border border-orange-500/30 text-orange-400 py-3 rounded-xl hover:bg-orange-500/10 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {processing ? "Processing..." : "Process Expired Star Names"}
          </button>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/admin/export/requests`}
            className="block w-full border border-white/20 text-white/60 py-3 rounded-xl text-center text-sm hover:bg-white/5 transition-colors"
          >
            Export Requests CSV
          </a>
        </div>
      </div>
    </div>
  );
}
