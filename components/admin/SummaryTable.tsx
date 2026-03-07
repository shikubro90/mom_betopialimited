"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Mail, MailX, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SummaryRow {
  id:        string;
  title:     string;
  date:      string | null;
  shortGist: string;
  emailSent: boolean;
  tone:      string;
  createdAt: string;
}

const PAGE_SIZE = 15;

function StatusBadge({ sent }: { sent: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        sent
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-gray-700 text-gray-400"
      )}
    >
      {sent ? <Mail className="w-3 h-3" /> : <MailX className="w-3 h-3" />}
      {sent ? "Sent" : "Pending"}
    </span>
  );
}

function ToneBadge({ tone }: { tone: string }) {
  const colours: Record<string, string> = {
    professional: "bg-brand-500/15 text-brand-400",
    executive:    "bg-purple-500/15 text-purple-400",
    casual:       "bg-amber-500/15 text-amber-400",
    detailed:     "bg-cyan-500/15 text-cyan-400",
    concise:      "bg-pink-500/15 text-pink-400",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", colours[tone] ?? "bg-gray-700 text-gray-400")}>
      {tone}
    </span>
  );
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
    hour:  "2-digit",
    minute:"2-digit",
  }).format(new Date(iso));
}

interface Props {
  rows:  SummaryRow[];
  total: number;
  sent:  number;
  week:  number;
}

export function SummaryTable({ rows, total, sent, week }: Props) {
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Briefs",  value: total, color: "text-brand-400" },
          { label: "Emails Sent",   value: sent,  color: "text-emerald-400" },
          { label: "This Week",     value: week,  color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
            <p className={cn("text-3xl font-extrabold mt-1", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table card ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-gray-200">Meeting Briefs</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by title…"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                {["Title", "Date", "Tone", "Gist", "Email", "Created"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-600 text-sm">
                    No results found.
                  </td>
                </tr>
              ) : (
                slice.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors group"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-200 max-w-[180px] truncate">
                      {row.title}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                      {row.date ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <ToneBadge tone={row.tone} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 max-w-[260px]">
                      <p className="truncate italic text-xs">{row.shortGist}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge sent={row.emailSent} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {fmt(row.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/${row.id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-brand-400 hover:text-brand-300 text-xs font-semibold"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-800">
          {slice.length === 0 ? (
            <p className="px-5 py-10 text-center text-gray-600 text-sm">No results found.</p>
          ) : (
            slice.map((row) => (
              <Link
                key={row.id}
                href={`/admin/${row.id}`}
                className="flex flex-col gap-2 px-5 py-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-200 text-sm">{row.title}</p>
                  <StatusBadge sent={row.emailSent} />
                </div>
                <p className="text-xs text-gray-400 italic truncate">{row.shortGist}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <ToneBadge tone={row.tone} />
                  <span>{row.date ?? "No date"}</span>
                  <span>{fmt(row.createdAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {" · "}page {safePage} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
