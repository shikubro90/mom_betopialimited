"use client";

import { useState, useRef, useCallback } from "react";
import { Trash2, Upload, Search, Users, X, AlertCircle, CheckCircle2 } from "lucide-react";

type Contact = {
  id:         string;
  name:       string;
  email:      string;
  uploadedAt: string;
};

interface Props {
  initialContacts: Contact[];
}

function parseCsv(text: string): Array<{ name: string; email: string }> {
  const lines   = text.split(/\r?\n/).filter(Boolean);
  const results: Array<{ name: string; email: string }> = [];

  // Skip header row if it looks like a header
  const startIdx = lines[0]?.toLowerCase().includes("name") || lines[0]?.toLowerCase().includes("display") ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    // Split by comma, handle quoted fields
    const cols = lines[i].match(/("(?:[^"]|"")*"|[^,]*)/g)?.map((c) =>
      c.startsWith('"') ? c.slice(1, -1).replace(/""/g, '"') : c
    ) ?? lines[i].split(",");

    // Try to find name and email columns heuristically
    // Common CSV format: "Display Name","Email Address",...
    const name  = cols[0]?.trim() ?? "";
    const email = cols[1]?.trim() ?? "";

    if (email && email.includes("@")) {
      results.push({ name, email });
    } else {
      // Try other column orderings
      for (const col of cols) {
        const v = col.trim();
        if (v.includes("@")) {
          results.push({ name, email: v });
          break;
        }
      }
    }
  }

  return results;
}

export function ContactsManager({ initialContacts }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [query, setQuery]       = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]  = useState(false);
  const [toast, setToast]        = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshContacts = async () => {
    try {
      const res  = await fetch("/api/contacts");
      if (!res.ok) return;
      const data = await res.json();
      // API returns {id, name, email} without uploadedAt — keep existing uploadedAt
      setContacts((prev) => {
        const map = Object.fromEntries(prev.map((c) => [c.id, c]));
        return (data as { id: string; name: string; email: string }[]).map((c) => ({
          ...c,
          uploadedAt: map[c.id]?.uploadedAt ?? new Date().toISOString(),
        }));
      });
    } catch { /* ignore */ }
  };

  const uploadContacts = useCallback(async (list: Array<{ name: string; email: string }>) => {
    if (list.length === 0) {
      showToast("error", "No valid contacts found in the CSV.");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/admin/contacts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ contacts: list }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast("error", (err as { error?: string }).error ?? "Upload failed");
        return;
      }
      const { upserted } = await res.json() as { upserted: number };
      showToast("success", `${upserted} contacts uploaded successfully.`);
      // Re-fetch full list
      const allRes = await fetch("/api/contacts");
      if (allRes.ok) {
        const allData = await allRes.json() as { id: string; name: string; email: string }[];
        setContacts(allData.map((c) => ({
          ...c,
          uploadedAt: new Date().toISOString(),
        })));
      }
    } catch {
      showToast("error", "Network error during upload.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      showToast("error", "Only .csv files are accepted.");
      return;
    }
    const text     = await file.text();
    const contacts = parseCsv(text);
    await uploadContacts(contacts);
  }, [uploadContacts]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("error", "Failed to delete contact.");
        return;
      }
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      showToast("error", "Network error.");
    }
  };

  const filtered = contacts.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" />
          <h1 className="text-xl font-bold text-gray-100">Employee Directory</h1>
          <span className="ml-2 px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-400">
            {contacts.length} contacts
          </span>
        </div>
      </div>

      {/* CSV Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-brand-400 bg-brand-950/30"
            : "border-gray-700 hover:border-gray-500 bg-gray-900"
        }`}
      >
        <Upload className={`w-6 h-6 mx-auto mb-2 ${dragOver ? "text-brand-400" : "text-gray-500"}`} />
        <p className="text-sm text-gray-400">
          {uploading ? "Uploading…" : "Drag & drop a CSV file here, or click to browse"}
        </p>
        <p className="text-xs text-gray-600 mt-1">Format: Display Name, Email Address (one per row)</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
          disabled={uploading}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts…"
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Added</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                  {query ? "No contacts match your search." : "No contacts yet. Upload a CSV to get started."}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3 text-gray-100 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-400">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {new Date(c.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/50 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-4 h-4" />
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
