"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { Star } from "@/types";

export default function AdminStarsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [stars, setStars] = useState<Star[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Star>>({});

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== "Admin" && user?.role !== "SuperAdmin")) {
      router.push("/");
      return;
    }
    api.get("/admin/stars", { params: { limit: 200 } }).then((res) => setStars(res.data)).finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const filtered = stars.filter((s) =>
    !search ||
    s.common_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.catalog_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.constellation?.toLowerCase().includes(search.toLowerCase())
  );

  const saveEdit = async (starId: number) => {
    try {
      const res = await api.put(`/admin/stars/${starId}`, editData);
      setStars((prev) => prev.map((s) => (s.id === starId ? res.data : s)));
      setEditing(null);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      <div className="sticky top-0 z-20 bg-space-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-white/50 text-sm">← Admin</Link>
        <h1 className="font-bold">Star Management</h1>
        <span className="text-white/30 text-xs ml-auto">{stars.length} stars</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stars..."
          className="form-input"
        />

        {loading ? (
          <div className="text-white/40 text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((star) => (
              <div key={star.id} className="glass-panel p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{star.common_name || star.catalog_id}</div>
                    <div className="text-white/40 text-xs">{star.constellation} · {star.star_type} · Mag {star.magnitude}</div>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${star.is_available_for_naming ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/30"}`}>
                        {star.registry_status}
                      </span>
                      {star.is_named && <span className="text-xs bg-star-gold/20 text-star-gold px-2 py-0.5 rounded">Named</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditing(star.id === editing ? null : star.id); setEditData({}); }}
                    className="text-star-blue text-xs px-3 py-1.5 border border-star-blue/30 rounded-lg"
                  >
                    {editing === star.id ? "Cancel" : "Edit"}
                  </button>
                </div>

                {editing === star.id && (
                  <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                    <div>
                      <label className="form-label text-xs">Available for naming</label>
                      <select
                        className="form-select text-sm"
                        defaultValue={String(star.is_available_for_naming)}
                        onChange={(e) => setEditData((d) => ({ ...d, is_available_for_naming: e.target.value === "true" }))}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label text-xs">Registry Status</label>
                      <select
                        className="form-select text-sm"
                        defaultValue={star.registry_status}
                        onChange={(e) => setEditData((d) => ({ ...d, registry_status: e.target.value as Star["registry_status"] }))}
                      >
                        {["Available", "Pending", "Approved", "Expired", "Rejected"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => saveEdit(star.id)}
                      className="w-full bg-star-blue text-space-950 font-semibold py-2.5 rounded-xl text-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
