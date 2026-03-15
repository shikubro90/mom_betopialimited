"use client";

import { useState } from "react";
import { Search, Shield, ShieldOff, X, AlertCircle, CheckCircle2, Users } from "lucide-react";

type UserRow = {
  id:        string;
  name:      string | null;
  email:     string;
  role:      "USER" | "ADMIN";
  blocked:   boolean;
  createdAt: string;
};

interface Props {
  initialUsers: UserRow[];
}

export function UsersManager({ initialUsers }: Props) {
  const [users, setUsers]   = useState<UserRow[]>(initialUsers);
  const [query, setQuery]   = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast]   = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleBlock = async (user: UserRow) => {
    setLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ blocked: !user.blocked }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast("error", (err as { error?: string }).error ?? "Failed to update user.");
        return;
      }
      const updated = await res.json() as UserRow;
      setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, blocked: updated.blocked } : u));
      showToast("success", updated.blocked ? `${user.email} has been blocked.` : `${user.email} has been unblocked.`);
    } catch {
      showToast("error", "Network error.");
    } finally {
      setLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const activeCount  = users.filter((u) => !u.blocked).length;
  const blockedCount = users.filter((u) => u.blocked).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success"
            ? "bg-emerald-800 border border-emerald-600 text-emerald-100"
            : "bg-red-900 border border-red-700 text-red-100"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle  className="w-4 h-4 shrink-0" />
          }
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header + Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" />
          <h1 className="text-xl font-bold text-gray-100">Users</h1>
          <span className="ml-2 px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-400">
            {users.length} total
          </span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full">
            {activeCount} active
          </span>
          <span className="px-2.5 py-1 bg-red-950 border border-red-800 text-red-400 rounded-full">
            {blockedCount} blocked
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or role…"
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
              <th className="px-4 py-3 w-24 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                  {query ? "No users match your search." : "No users found."}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className={`transition-colors ${u.blocked ? "bg-red-950/20" : "bg-gray-950"} hover:bg-gray-900`}>
                  <td className="px-4 py-3 text-gray-100 font-medium">
                    {u.name ?? <span className="text-gray-500 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === "ADMIN"
                        ? "bg-brand-950 border border-brand-800 text-brand-300"
                        : "bg-gray-800 text-gray-400"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.blocked
                        ? "bg-red-950 border border-red-800 text-red-400"
                        : "bg-emerald-950 border border-emerald-800 text-emerald-400"
                    }`}>
                      {u.blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleBlock(u)}
                      disabled={loading === u.id}
                      title={u.blocked ? "Unblock user" : "Block user"}
                      className={`flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.blocked
                          ? "bg-emerald-900/50 border border-emerald-700 text-emerald-400 hover:bg-emerald-900"
                          : "bg-red-900/50 border border-red-800 text-red-400 hover:bg-red-900"
                      }`}
                    >
                      {u.blocked
                        ? <><ShieldOff className="w-3.5 h-3.5" /> Unblock</>
                        : <><Shield    className="w-3.5 h-3.5" /> Block</>
                      }
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
