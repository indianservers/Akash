"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { NamingRequest } from "@/types";
import { formatDate, daysUntilExpiry } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Approved: "bg-green-500/20 text-green-400 border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  Expired: "bg-white/10 text-white/40 border-white/10",
  Cancelled: "bg-white/5 text-white/30 border-white/5",
};

function RequestCard({ req }: { req: NamingRequest }) {
  const days = daysUntilExpiry(req.expiry_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-star-white">{req.requested_name}</h3>
          <p className="text-white/50 text-sm">{req.dedication_type}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-lg border ${STATUS_COLORS[req.status] ?? ""}`}>
          {req.status}
        </span>
      </div>

      {req.recipient_name && (
        <p className="text-sm text-white/60">For: {req.recipient_name}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
        <div>Submitted: {formatDate(req.created_at)}</div>
        {req.approved_at && <div>Approved: {formatDate(req.approved_at)}</div>}
        {req.expiry_date && (
          <div className={days !== null && days < 30 ? "text-yellow-400" : ""}>
            Expires: {formatDate(req.expiry_date)}
            {days !== null && days > 0 && ` (${days}d)`}
          </div>
        )}
        {!req.expiry_date && req.status === "Approved" && (
          <div className="text-star-blue">Lifetime</div>
        )}
      </div>

      {req.certificate_id && (
        <div className="text-xs text-white/30 font-mono">{req.certificate_id}</div>
      )}

      <div className="flex gap-2 pt-1">
        {req.share_slug && (
          <Link
            href={`/star/${req.share_slug}`}
            className="text-xs text-star-blue underline"
          >
            View Public Page →
          </Link>
        )}
        {req.status === "Approved" && (
          <Link
            href={`/ar?star=${req.star_id}`}
            className="text-xs text-star-blue underline ml-auto"
          >
            View in AR →
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<NamingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard");
      return;
    }
    api.get("/my/star-requests").then((res) => {
      setRequests(res.data);
    }).finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const approved = requests.filter((r) => r.status === "Approved");
  const pending = requests.filter((r) => r.status === "Pending");

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      <div className="sticky top-0 z-20 bg-space-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-white/50 text-sm">← Home</Link>
        <h1 className="font-bold">My Stars</h1>
        <button onClick={() => { clearAuth(); router.push("/"); }} className="text-white/40 text-sm">
          Logout
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* User info */}
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-star-blue/20 flex items-center justify-center text-xl">
            {user?.full_name?.[0] ?? "?"}
          </div>
          <div>
            <div className="font-semibold">{user?.full_name}</div>
            <div className="text-white/40 text-sm">{user?.email}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Named Stars", value: approved.length, color: "text-green-400" },
            { label: "Pending", value: pending.length, color: "text-yellow-400" },
            { label: "Total", value: requests.length, color: "text-star-blue" },
          ].map((s) => (
            <div key={s.label} className="glass-panel p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-white/40 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link href="/ar" className="flex-1 btn-primary py-3 text-center text-sm">
            Open Sky Viewer
          </Link>
          <Link href="/registry" className="flex-1 btn-secondary py-3 text-center text-sm">
            Search Registry
          </Link>
        </div>

        {/* Requests */}
        <div>
          <h2 className="font-semibold mb-4">Star Naming History</h2>
          {loading ? (
            <div className="text-white/40 text-sm text-center py-8">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <div className="text-3xl mb-3">🌌</div>
              <p className="text-white/50 text-sm">No star naming requests yet.</p>
              <Link href="/ar" className="text-star-blue text-sm mt-3 inline-block">
                Go to Sky Viewer →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => <RequestCard key={req.id} req={req} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
