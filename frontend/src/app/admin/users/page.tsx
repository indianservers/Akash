"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== "Admin" && user?.role !== "SuperAdmin")) {
      router.push("/");
      return;
    }
    api.get("/admin/users", { params: { limit: 200 } }).then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const ROLE_COLORS: Record<string, string> = {
    User: "text-white/50",
    Admin: "text-star-blue",
    SuperAdmin: "text-star-gold",
  };

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      <div className="sticky top-0 z-20 bg-space-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-white/50 text-sm">← Admin</Link>
        <h1 className="font-bold">Users</h1>
        <span className="text-white/30 text-xs ml-auto">{users.length} users</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-white/40 text-center py-12">Loading...</div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="glass-panel p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{u.full_name}</div>
                <div className="text-white/40 text-sm">{u.email}</div>
                <div className="text-white/30 text-xs mt-0.5">Joined {formatDate(u.created_at)}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${ROLE_COLORS[u.role] ?? ""}`}>{u.role}</div>
                <div className={`text-xs mt-0.5 ${u.status === "Active" ? "text-green-400" : "text-red-400"}`}>
                  {u.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
