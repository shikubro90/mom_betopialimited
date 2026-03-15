"use client";

import { useEffect, useState } from "react";
import { type Vibe, getVibe }  from "@/lib/useVibe";

const VIBES: Record<Vibe, {
  bg: string;
  orbs: { color: string; size: string; x: string; y: string; blur: string; opacity: string; duration: string }[];
  particles: number;
  particleColor: string;
  label: string;
  emoji: string;
}> = {
  morning: {
    bg: "linear-gradient(135deg, #fef9c3 0%, #fed7aa 30%, #fde68a 60%, #e0f2fe 100%)",
    orbs: [
      { color: "#fbbf24", size: "600px", x: "-10%", y: "-20%", blur: "120px", opacity: "0.35", duration: "12s" },
      { color: "#fb923c", size: "400px", x: "70%",  y: "10%",  blur: "100px", opacity: "0.25", duration: "15s" },
      { color: "#fde68a", size: "350px", x: "40%",  y: "60%",  blur: "90px",  opacity: "0.20", duration: "18s" },
    ],
    particles: 18,
    particleColor: "#f59e0b",
    label: "Good morning",
    emoji: "🌅",
  },
  noon: {
    bg: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #dbeafe 70%, #ede9fe 100%)",
    orbs: [
      { color: "#38bdf8", size: "700px", x: "50%",  y: "-30%", blur: "140px", opacity: "0.30", duration: "10s" },
      { color: "#818cf8", size: "350px", x: "10%",  y: "50%",  blur: "100px", opacity: "0.20", duration: "14s" },
      { color: "#7dd3fc", size: "300px", x: "80%",  y: "60%",  blur: "90px",  opacity: "0.18", duration: "16s" },
    ],
    particles: 14,
    particleColor: "#0ea5e9",
    label: "Good noon",
    emoji: "☀️",
  },
  afternoon: {
    bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fed7aa 60%, #fecdd3 100%)",
    orbs: [
      { color: "#f59e0b", size: "500px", x: "60%",  y: "-10%", blur: "120px", opacity: "0.30", duration: "13s" },
      { color: "#fb923c", size: "400px", x: "-5%",  y: "30%",  blur: "100px", opacity: "0.22", duration: "16s" },
      { color: "#fca5a5", size: "300px", x: "45%",  y: "70%",  blur: "80px",  opacity: "0.18", duration: "20s" },
    ],
    particles: 16,
    particleColor: "#f97316",
    label: "Good afternoon",
    emoji: "🌤️",
  },
  evening: {
    bg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 25%, #7c2d12 55%, #f97316 85%, #fbbf24 100%)",
    orbs: [
      { color: "#c026d3", size: "600px", x: "30%",  y: "-20%", blur: "130px", opacity: "0.40", duration: "11s" },
      { color: "#ea580c", size: "450px", x: "70%",  y: "20%",  blur: "110px", opacity: "0.35", duration: "14s" },
      { color: "#7c3aed", size: "350px", x: "10%",  y: "60%",  blur: "90px",  opacity: "0.28", duration: "17s" },
    ],
    particles: 22,
    particleColor: "#f97316",
    label: "Good evening",
    emoji: "🌇",
  },
  night: {
    bg: "linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 70%, #0f172a 100%)",
    orbs: [
      { color: "#6366f1", size: "500px", x: "20%",  y: "-15%", blur: "120px", opacity: "0.30", duration: "14s" },
      { color: "#4f46e5", size: "400px", x: "75%",  y: "30%",  blur: "110px", opacity: "0.22", duration: "18s" },
      { color: "#7c3aed", size: "300px", x: "50%",  y: "75%",  blur: "90px",  opacity: "0.18", duration: "22s" },
    ],
    particles: 30,
    particleColor: "#a5b4fc",
    label: "Good night",
    emoji: "🌙",
  },
};

interface Particle {
  id: number;
  x: string;
  y: string;
  size: string;
  duration: string;
  delay: string;
  opacity: string;
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x:        `${Math.random() * 100}%`,
    y:        `${Math.random() * 100}%`,
    size:     `${2 + Math.random() * 3}px`,
    duration: `${4 + Math.random() * 8}s`,
    delay:    `${Math.random() * 6}s`,
    opacity:  `${0.3 + Math.random() * 0.5}`,
  }));
}

export function VibeBackground() {
  const [vibe,      setVibe]      = useState<Vibe | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const update = () => {
      const v = getVibe(new Date().getHours());
      setVibe(v);
      setParticles(makeParticles(VIBES[v].particles));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!vibe) return null;

  const cfg = VIBES[vibe];

  return (
    <>
      {/* ── CSS animations ───────────────────────── */}
      <style>{`
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 25px) scale(0.97); }
        }
        @keyframes particle-float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: var(--p-op); }
          50%       { transform: translateY(-18px) translateX(8px); opacity: calc(var(--p-op) * 0.4); }
        }
        @keyframes vibe-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Base gradient ────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 transition-all duration-[2000ms]"
        style={{ background: cfg.bg, animation: "vibe-fadein 2s ease" }}
      />

      {/* ── Animated orbs ───────────────────────── */}
      {cfg.orbs.map((orb, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none fixed -z-10 rounded-full"
          style={{
            width:     orb.size,
            height:    orb.size,
            left:      orb.x,
            top:       orb.y,
            background: orb.color,
            filter:    `blur(${orb.blur})`,
            opacity:   orb.opacity,
            animation: `orb-drift ${orb.duration} ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* ── Floating particles ──────────────────── */}
      {particles.map((p) => (
        <div
          key={p.id}
          aria-hidden
          className="pointer-events-none fixed -z-10 rounded-full"
          style={{
            left:     p.x,
            top:      p.y,
            width:    p.size,
            height:   p.size,
            background: cfg.particleColor,
            opacity:  p.opacity,
            ["--p-op" as string]: p.opacity,
            animation: `particle-float ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

    </>
  );
}
