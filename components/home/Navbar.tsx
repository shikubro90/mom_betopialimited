"use client";

import { useEffect, useState } from "react";
import Link                     from "next/link";
import { useRouter }            from "next/navigation";
import { Logo }                 from "@/components/shared/Logo";
import { useVibe }              from "@/lib/useVibe";
import { VibeCalendar }         from "@/components/home/VibeCalendar";

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: "Good morning",   emoji: "🌅" };
  if (h >= 12 && h < 14) return { text: "Good noon",      emoji: "☀️" };
  if (h >= 14 && h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (h >= 17 && h < 20) return { text: "Good evening",   emoji: "🌇" };
  return                         { text: "Good night",     emoji: "🌙" };
}

export function Navbar() {
  const router = useRouter();
  const theme  = useVibe();
  const [user,    setUser]    = useState<{ email: string; name: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { setUser(d.user ?? null); setChecked(true); })
      .catch(() => setChecked(true));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/"; // full reload clears all state
  };

  const navBg     = theme.isDark ? "rgba(10,10,30,0.55)"   : "rgba(255,255,255,0.65)";
  const navBorder = theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)";
  const linkColor = theme.textMuted;

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{ background: navBg, borderBottom: `1px solid ${navBorder}` }}
    >
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <VibeCalendar />
        </div>
        <div className="flex items-center gap-2">
          {/* Greeting — shown for all users, with name if logged in */}
          {checked && (
            <span className="text-sm font-medium hidden sm:block" style={{ color: theme.text }}>
              {(() => {
                const g = getGreeting();
                return user
                  ? <>{g.emoji} {g.text}, <span className="font-bold">{user.name}</span></>
                  : <>{g.emoji} {g.text}</>;
              })()}
            </span>
          )}

          {checked && (
            user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-500 transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-sm font-semibold transition-colors"
                  style={{ color: linkColor }}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-500 transition-colors"
                >
                  Register
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
