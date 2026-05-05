"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { NamingRequest } from "@/types";

const STATUSES = ["", "Pending", "Approved", "Rejected", "Expired", "Cancelled"];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Approved: "bg-green-500/20 text-green-400 border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  Expired: "bg-white/10 text-white/40 border-white/10",
  Cancelled: "bg-white/5 text-white/30 border-white/5",
};

interface ApproveForm {
  validity_plan: string;
  admin_notes: string;
}

interface RejectForm {
  rejection_reason: string;
}

function RequestRow({ req, onRefresh }: { req: NamingRequest; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approveForm, setApproveForm] = useState<ApproveForm>({ validity_plan: "1year", admin_notes: "" });
  const [rejectForm, setRejectForm] = useState<RejectForm>({ rejection_reason: "" });
  const [error, setError] = useState<string | null>(null);

  const approve = async () => {
    setApproving(true);
    setError(null);
    try {
      await api.post(`/admin/star-requests/${req.id}/approve`, {
        validity_plan: approveForm.validity_plan,
        admin_notes: approveForm.admin_notes || undefined,
      });
      onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail || "Failed");
    } finally {
      setApproving(false);
    }
  };

  const reject = async () => {
    if (!rejectForm.rejection_reason.trim()) { setError("Rejection reason required"); return; }
    setRejecting(true);
    setError(null);
    try {
      await api.post(`/admin/star-requests/${req.id}/reject`, rejectForm);
      onRefresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail || "Failed");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="glass-panel overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-start justify-between gap-3"
      >
        <div>
          <div className="font-semibold text-star-white">{req.requested_name}</div>
          <div className="text-white/50 text-sm">Star #{req.star_id} · {req.dedication_type}</div>
          <div className="text-white/30 text-xs mt-1">By {req.applicant_name} · {formatDate(req.created_at)}</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-lg border flex-shrink-0 ${STATUS_COLORS[req.status] ?? ""}`}>
          {req.status}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-4 border-t border-white/5">
          <div className="grid grid-cols-2 gap-2 text-xs text-white/50 pt-3">
            {req.recipient_name && <div>For: {req.recipient_name}</div>}
            {req.relationship && <div>Relation: {req.relationship}</div>}
            {req.occasion && <div>Occasion: {req.occasion}</div>}
            <div>Validity: {req.validity_plan}</div>
            <div>Visibility: {req.visibility_preference}</div>
          </div>
          {req.dedication_message && (
            <div className="bg-space-800/50 rounded-xl p-3 text-sm text-white/70">{req.dedication_message}</div>
          )}
          {req.rejection_reason && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3 text-xs text-red-300">
              Rejection: {req.rejection_reason}
            </div>
          )}
          {req.certificate_id && <div className="text-xs font-mono text-white/30">{req.certificate_id}</div>}

          {req.status === "Pending" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <select
                  value={approveForm.validity_plan}
                  onChange={(e) => setApproveForm((f) => ({ ...f, validity_plan: e.target.value }))}
                  className="form-select text-sm"
                >
                  <option value="1year">1 Year</option>
                  <option value="5years">5 Years</option>
                  <option value="lifetime">Lifetime</option>
                </select>
                <input
                  value={approveForm.admin_notes}
                  onChange={(e) => setApproveForm((f) => ({ ...f, admin_notes: e.target.value }))}
                  placeholder="Admin notes (optional)"
                  className="form-input text-sm"
                />
                <button
                  onClick={approve}
                  disabled={approving}
                  className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {approving ? "Approving..." : "Approve Request"}
                </button>
              </div>
              <div className="space-y-2">
                <input
                  value={rejectForm.rejection_reason}
                  onChange={(e) => setRejectForm({ rejection_reason: e.target.value })}
                  placeholder="Rejection reason (required)"
                  className="form-input text-sm"
                />
                <button
                  onClick={reject}
                  disabled={rejecting}
                  className="w-full border border-red-500/40 text-red-400 py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {rejecting ? "Rejecting..." : "Reject Request"}
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function AdminRequestsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<NamingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/star-requests", { params: { status: status || undefined } });
      setRequests(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== "Admin" && user?.role !== "SuperAdmin")) {
      router.push("/");
      return;
    }
    fetchRequests();
  }, [isAuthenticated, user, status]);

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      <div className="sticky top-0 z-20 bg-space-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-white/50 text-sm">← Admin</Link>
        <h1 className="font-bold">Naming Requests</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-colors ${
                status === s
                  ? "border-star-blue text-star-blue bg-star-blue/10"
                  : "border-white/10 text-white/40"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-white/40 text-center py-12">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="glass-panel p-10 text-center text-white/40">No requests found.</div>
        ) : (
          <div className="space-y-3">
            <p className="text-white/30 text-xs">{requests.length} request(s)</p>
            {requests.map((r) => <RequestRow key={r.id} req={r} onRefresh={fetchRequests} />)}
          </div>
        )}
      </div>
    </div>
  );
}
