"use client";

import { useState, FormEvent }  from "react";
import Link                      from "next/link";
import { useRouter }             from "next/navigation";
import { Eye, EyeOff }           from "lucide-react";
import { Logo }                  from "@/components/shared/Logo";
import { cn }                    from "@/lib/utils";

const PUBLIC_DOMAINS = ["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","aol.com","protonmail.com","live.com"];

function validateEmail(email: string): string | null {
  if (!email || !email.includes("@")) return "Enter a valid email address";
  const domain = email.split("@")[1];
  if (PUBLIC_DOMAINS.includes(domain))
    return "Personal email not allowed. Use your work email.";
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())         e.name     = "Name is required";
    const emailErr = validateEmail(email.trim().toLowerCase());
    if (emailErr)             e.email    = emailErr;
    if (password.length < 8) e.password = "At least 8 characters required";
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError("");
    const fe = validate();
    if (Object.keys(fe).length > 0) { setErrors(fe); return; }
    setErrors({});
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const json = await res.json();
      if (!res.ok) { setApiError(json.error ?? "Registration failed"); return; }
      router.push("/"); router.refresh();
    } catch { setApiError("Something went wrong. Please try again."); }
    finally  { setLoading(false); }
  };

  const inputCls = (id: string) => cn(
    "w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-900",
    "placeholder:text-gray-400 outline-none transition-all",
    errors[id]
      ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-3 focus:ring-red-100"
      : "border-gray-200 focus:bg-white focus:border-brand-400 focus:ring-3 focus:ring-brand-100"
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
              <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
              <p className="mt-1 text-sm text-gray-500">Work emails only — personal not accepted</p>
            </div>

            {apiError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <span className="mt-0.5 shrink-0">⚠</span> {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Full name</label>
                <input type="text" autoComplete="name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" className={inputCls("name")} />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Work email</label>
                <input type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" className={inputCls("email")} />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" className={cn(inputCls("password"), "pr-11")} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password
                  ? <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                  : <p className="mt-1.5 text-xs text-gray-400">Minimum 8 characters</p>}
              </div>

              <button type="submit" disabled={loading} className={cn(
                "mt-2 w-full rounded-xl py-3 px-4 text-sm font-semibold text-white",
                "bg-gradient-to-r from-brand-600 to-purple-600",
                "hover:from-brand-500 hover:to-purple-500",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                "transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              )}>
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
