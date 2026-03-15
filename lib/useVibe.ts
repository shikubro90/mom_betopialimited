"use client";

import { useEffect, useState } from "react";

export type Vibe = "morning" | "noon" | "afternoon" | "evening" | "night";

export function getVibe(hour: number): Vibe {
  if (hour >= 5  && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "noon";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export interface VibeTheme {
  vibe:        Vibe;
  isDark:      boolean;          // evening / night
  text:        string;           // primary text color (inline style)
  textMuted:   string;           // secondary/muted text
  textAccent:  string;           // highlighted / gradient text colors
  badge:       { bg: string; border: string; text: string };
  statValue:   string;
  statLabel:   string;
}

const THEMES: Record<Vibe, VibeTheme> = {
  morning: {
    vibe: "morning", isDark: false,
    text:       "rgba(28,  20,  0, 0.9)",
    textMuted:  "rgba(120, 80, 10, 0.75)",
    textAccent: "linear-gradient(135deg, #b45309 0%, #ea580c 50%, #db2777 100%)",
    badge:      { bg: "rgba(254,243,199,0.8)", border: "rgba(251,191,36,0.5)", text: "#92400e" },
    statValue:  "#b45309",
    statLabel:  "rgba(120,80,10,0.6)",
  },
  noon: {
    vibe: "noon", isDark: false,
    text:       "rgba(10,  30,  60, 0.9)",
    textMuted:  "rgba(30,  90, 150, 0.7)",
    textAccent: "linear-gradient(135deg, #0369a1 0%, #6366f1 50%, #7c3aed 100%)",
    badge:      { bg: "rgba(224,242,254,0.85)", border: "rgba(56,189,248,0.5)", text: "#0369a1" },
    statValue:  "#0284c7",
    statLabel:  "rgba(30,90,150,0.6)",
  },
  afternoon: {
    vibe: "afternoon", isDark: false,
    text:       "rgba(40,  20,  0, 0.9)",
    textMuted:  "rgba(154, 80, 10, 0.75)",
    textAccent: "linear-gradient(135deg, #b45309 0%, #ea580c 45%, #e11d48 100%)",
    badge:      { bg: "rgba(255,237,213,0.85)", border: "rgba(251,146,60,0.5)", text: "#9a3412" },
    statValue:  "#c2410c",
    statLabel:  "rgba(154,80,10,0.6)",
  },
  evening: {
    vibe: "evening", isDark: true,
    text:       "rgba(255,245,235, 0.95)",
    textMuted:  "rgba(255,210,170, 0.75)",
    textAccent: "linear-gradient(135deg, #fb923c 0%, #e879f9 50%, #818cf8 100%)",
    badge:      { bg: "rgba(255,255,255,0.12)", border: "rgba(255,160,80,0.45)", text: "#fed7aa" },
    statValue:  "#fb923c",
    statLabel:  "rgba(255,210,170,0.65)",
  },
  night: {
    vibe: "night", isDark: true,
    text:       "rgba(220,225,255, 0.95)",
    textMuted:  "rgba(165,180,252, 0.70)",
    textAccent: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)",
    badge:      { bg: "rgba(255,255,255,0.08)", border: "rgba(129,140,248,0.40)", text: "#c7d2fe" },
    statValue:  "#818cf8",
    statLabel:  "rgba(165,180,252,0.60)",
  },
};

export function useVibe(): VibeTheme {
  const [vibe, setVibe] = useState<Vibe>("morning");

  useEffect(() => {
    const update = () => setVibe(getVibe(new Date().getHours()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return THEMES[vibe];
}
