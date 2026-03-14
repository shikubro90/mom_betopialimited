"use client";

import { useEffect, useState } from "react";
import type { WeatherType }    from "@/app/api/weather/route";
import { useVibe }             from "@/lib/useVibe";

/* ── random seed helpers (stable per render) ─────────────── */
function seeded(seed: number, i: number) {
  const x = Math.sin(seed + i) * 10000;
  return x - Math.floor(x);
}

/* ── Rain drops ──────────────────────────────────────────── */
function Rain({ heavy = false }: { heavy?: boolean }) {
  const count = heavy ? 60 : 35;
  return (
    <>
      <style>{`
        @keyframes rain-fall {
          0%   { transform: translateY(-10vh) translateX(0);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(110vh) translateX(-8vw); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none fixed -z-5"
          style={{
            left:            `${seeded(1, i) * 110 - 5}%`,
            top:             `-${seeded(2, i) * 20}%`,
            width:           heavy ? "1.5px" : "1px",
            height:          `${12 + seeded(3, i) * 18}px`,
            background:      heavy
              ? "linear-gradient(to bottom, transparent, rgba(147,197,253,0.7))"
              : "linear-gradient(to bottom, transparent, rgba(186,230,253,0.55))",
            borderRadius:    "2px",
            animation:       `rain-fall ${0.55 + seeded(4, i) * 0.55}s linear infinite`,
            animationDelay:  `${seeded(5, i) * 1.5}s`,
          }}
        />
      ))}
    </>
  );
}

/* ── Snowflakes ──────────────────────────────────────────── */
function Snow() {
  return (
    <>
      <style>{`
        @keyframes snow-fall {
          0%   { transform: translateY(-5vh) translateX(0) rotate(0deg);   opacity: 0; }
          10%  { opacity: 0.85; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(108vh) translateX(${5}vw) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none fixed -z-5 rounded-full"
          style={{
            left:           `${seeded(1, i) * 100}%`,
            top:            `-${seeded(2, i) * 10}%`,
            width:          `${3 + seeded(3, i) * 4}px`,
            height:         `${3 + seeded(3, i) * 4}px`,
            background:     "rgba(219,234,254,0.85)",
            boxShadow:      "0 0 4px rgba(219,234,254,0.6)",
            animation:      `snow-fall ${3 + seeded(4, i) * 4}s linear infinite`,
            animationDelay: `${seeded(5, i) * 4}s`,
          }}
        />
      ))}
    </>
  );
}

/* ── Clouds ──────────────────────────────────────────────── */
function Clouds({ density = 3, opacity = 0.18 }: { density?: number; opacity?: number }) {
  const clouds = Array.from({ length: density }, (_, i) => ({
    id:       i,
    width:    `${140 + seeded(1, i) * 200}px`,
    height:   `${55  + seeded(2, i) * 55}px`,
    top:      `${3   + seeded(3, i) * 22}%`,
    left:     `-${20 + seeded(4, i) * 10}%`,
    duration: `${28  + seeded(5, i) * 40}s`,
    delay:    `${seeded(6, i) * -30}s`,
    blur:     `${18  + seeded(7, i) * 20}px`,
    scale:    `${0.8 + seeded(8, i) * 0.7}`,
  }));

  return (
    <>
      <style>{`
        @keyframes cloud-drift {
          0%   { transform: translateX(0) scaleX(var(--sc)); }
          100% { transform: translateX(130vw) scaleX(var(--sc)); }
        }
      `}</style>
      {clouds.map(c => (
        <div
          key={c.id}
          aria-hidden
          className="pointer-events-none fixed -z-5 rounded-full"
          style={{
            top:            c.top,
            left:           c.left,
            width:          c.width,
            height:         c.height,
            background:     "rgba(241,245,249,0.75)",
            filter:         `blur(${c.blur})`,
            opacity,
            ["--sc" as string]: c.scale,
            animation:      `cloud-drift ${c.duration} linear infinite`,
            animationDelay: c.delay,
          }}
        />
      ))}
    </>
  );
}

/* ── Sun glow + rays ─────────────────────────────────────── */
function Sun({ isDark }: { isDark: boolean }) {
  const color = isDark ? "rgba(251,191,36,0.35)" : "rgba(253,224,71,0.45)";
  return (
    <>
      <style>{`
        @keyframes sun-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.55; }
          50%       { transform: translate(-50%, -50%) scale(1.12); opacity: 0.75; }
        }
        @keyframes sun-ray {
          0%, 100% { opacity: 0.12; transform: rotate(var(--ra)) scaleY(1); }
          50%       { opacity: 0.22; transform: rotate(var(--ra)) scaleY(1.08); }
        }
      `}</style>

      {/* core glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed -z-5 rounded-full"
        style={{
          width:     "320px",
          height:    "320px",
          left:      "72%",
          top:       "8%",
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          animation: "sun-pulse 5s ease-in-out infinite",
        }}
      />

      {/* rays */}
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none fixed -z-5"
          style={{
            width:          "3px",
            height:         `${60 + seeded(1, i) * 40}px`,
            left:           "72%",
            top:            "8%",
            background:     `linear-gradient(to bottom, ${color}, transparent)`,
            borderRadius:   "2px",
            transformOrigin: "top center",
            ["--ra" as string]: `${i * 45}deg`,
            animation:      `sun-ray ${3 + seeded(2, i) * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </>
  );
}

/* ── Lightning flash ─────────────────────────────────────── */
function Lightning() {
  return (
    <>
      <style>{`
        @keyframes lightning {
          0%, 92%, 94%, 100% { opacity: 0; }
          93%                 { opacity: 0.18; }
        }
      `}</style>
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-5"
          style={{
            background:     "rgba(230,230,255,1)",
            animation:      `lightning ${6 + seeded(1, i) * 8}s ease-in-out infinite`,
            animationDelay: `${seeded(2, i) * 6}s`,
          }}
        />
      ))}
    </>
  );
}

/* ── Fog layers ──────────────────────────────────────────── */
function Fog() {
  return (
    <>
      <style>{`
        @keyframes fog-drift {
          0%   { transform: translateX(-5%) translateY(0); opacity: 0.10; }
          50%  { transform: translateX( 3%) translateY(-8px); opacity: 0.18; }
          100% { transform: translateX(-5%) translateY(0); opacity: 0.10; }
        }
      `}</style>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none fixed left-0 right-0 -z-5"
          style={{
            top:            `${10 + i * 20}%`,
            height:         `${80 + seeded(1, i) * 60}px`,
            background:     "linear-gradient(to right, transparent, rgba(241,245,249,0.55), rgba(226,232,240,0.55), transparent)",
            filter:         "blur(18px)",
            animation:      `fog-drift ${12 + seeded(2, i) * 10}s ease-in-out infinite`,
            animationDelay: `${seeded(3, i) * -8}s`,
          }}
        />
      ))}
    </>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function WeatherEffect() {
  const theme = useVibe();
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const [temp,    setTemp]    = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetch(`/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`)
          .then(r => r.json())
          .then(d => { setWeather(d.weather); setTemp(d.temp); })
          .catch(() => {});
      },
      () => {} // silently skip if denied
    );
  }, []);

  if (!weather) return null;

  const labelColor = theme.isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.38)";
  const labelBg    = theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.45)";
  const labelBorder= theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)";

  const ICONS: Record<WeatherType, string> = {
    "sunny":        "☀️",
    "partly-cloudy":"⛅",
    "cloudy":       "☁️",
    "rainy":        "🌧️",
    "stormy":       "⛈️",
    "snowy":        "❄️",
    "foggy":        "🌫️",
  };

  return (
    <>
      {weather === "sunny"         && <Sun isDark={theme.isDark} />}
      {weather === "partly-cloudy" && <><Sun isDark={theme.isDark} /><Clouds density={2} opacity={0.14} /></>}
      {weather === "cloudy"        && <Clouds density={5} opacity={0.22} />}
      {weather === "foggy"         && <><Clouds density={3} opacity={0.15} /><Fog /></>}
      {weather === "rainy"         && <><Clouds density={4} opacity={0.20} /><Rain /></>}
      {weather === "stormy"        && <><Clouds density={6} opacity={0.28} /><Rain heavy /><Lightning /></>}
      {weather === "snowy"         && <><Clouds density={3} opacity={0.18} /><Snow /></>}

      {/* weather badge — bottom-right, subtle */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-5 right-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm"
        style={{ background: labelBg, border: `1px solid ${labelBorder}`, color: labelColor }}
      >
        <span>{ICONS[weather]}</span>
        <span>{weather.replace("-", " ")}{temp !== null ? ` · ${Math.round(temp)}°C` : ""}</span>
      </div>
    </>
  );
}
