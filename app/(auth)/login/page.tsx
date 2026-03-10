"use client";

import { useState, FormEvent } from "react";
import Link                     from "next/link";
import { useRouter }            from "next/navigation";
import { Eye, EyeOff }          from "lucide-react";
import { Logo }                 from "@/components/shared/Logo";
import { cn }                   from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Login failed"); return; }
      router.push("/"); router.refresh();
    } catch { setError("Something went wrong. Please try again."); }
    finally  { setLoading(false); }
  };

  const inputCls = cn(
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900",
    "placeholder:text-gray-400 outline-none transition-all",
    "focus:bg-white focus:border-brand-400 focus:ring-3 focus:ring-brand-100"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 flex flex-col">
      {/* Navbar strip */}
      <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link href="/"><Logo size="sm" /></Link>
        </div>
      </nav>

      {/* Glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.14) 0%, transparent 70%)" }} />

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="relative z-10 w-full max-w-[420px]">
          <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50 px-8 py-10">

            {/* Header */}
            <div className="mb-8 text-center">
              <Logo size="md" className="justify-center mb-4" />
              <h1 className="text-xl font-bold text-gray-900">Sign in to your account</h1>
              <p className="mt-1 text-sm text-gray-500">Use your work email to continue</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <span className="mt-0.5 shrink-0">⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Work email
                </label>
                <input type="email" autoComplete="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} autoComplete="current-password"
                    required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className={cn(inputCls, "pr-11")} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={cn(
                "mt-2 w-full rounded-xl py-3 px-4 text-sm font-semibold text-white",
                "bg-gradient-to-r from-brand-600 to-purple-600",
                "hover:from-brand-500 hover:to-purple-500",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                "transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              )}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
