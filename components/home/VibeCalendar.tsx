"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight }   from "lucide-react";
import { useVibe, type VibeTheme }     from "@/lib/useVibe";

const DAYS   = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function calDays(year: number, month: number) {
  const first     = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function glassStyle(theme: VibeTheme) {
  return {
    background:             theme.isDark ? "rgba(15,15,40,0.72)"    : "rgba(255,255,255,0.72)",
    backdropFilter:         "blur(24px)",
    WebkitBackdropFilter:   "blur(24px)",
    border:                 `1px solid ${theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.55)"}`,
    boxShadow:              theme.isDark
      ? "0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset"
      : "0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.8) inset",
  };
}

export function VibeCalendar() {
  const theme             = useVibe();
  const [open, setOpen]   = useState(false);
  const [now,  setNow]    = useState<Date | null>(null);
  const [view, setView]   = useState<{ y: number; m: number } | null>(null);
  const ref               = useRef<HTMLDivElement>(null);

  // tick every second
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // sync view to current month when opening
  useEffect(() => {
    if (open && now) setView({ y: now.getFullYear(), m: now.getMonth() });
  }, [open]);  // eslint-disable-line react-hooks/exhaustive-deps

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!now) return null;

  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const viewY = view?.y ?? todayY;
  const viewM = view?.m ?? todayM;
  const cells = calDays(viewY, viewM);

  const isToday   = (d: number) => d === todayD && viewM === todayM && viewY === todayY;
  const isWeekend = (i: number) => i % 7 === 0 || i % 7 === 6;

  const prevMonth = () => setView(v => {
    const m = (v!.m - 1 + 12) % 12;
    return { y: m === 11 ? v!.y - 1 : v!.y, m };
  });
  const nextMonth = () => setView(v => {
    const m = (v!.m + 1) % 12;
    return { y: m === 0 ? v!.y + 1 : v!.y, m };
  });

  // pill text: "Sun, 15 Mar  •  09:42:05"
  const weekday  = now.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum   = todayD;
  const monShort = MONTHS[todayM].slice(0, 3);
  const timeStr  = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const accentGrad = theme.textAccent;

  return (
    <div ref={ref} className="relative select-none">
      {/* ── Collapsed pill ───────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200"
        style={{
          background:    theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)",
          border:        `1px solid ${theme.isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)"}`,
          backdropFilter: "blur(12px)",
          color:          theme.text,
        }}
      >
        {/* date part */}
        <span
          className="transition-all duration-300 group-hover:scale-105"
          style={{ backgroundImage: accentGrad, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          {weekday}, {dayNum} {monShort}
        </span>

        <span style={{ color: theme.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>•</span>

        {/* time part */}
        <span
          className="font-mono transition-all duration-300 group-hover:scale-105"
          style={{ color: theme.textMuted }}
        >
          {timeStr}
        </span>
      </button>

      {/* ── Expanded calendar ────────────────────────── */}
      <div
        className="absolute left-0 top-full mt-2 rounded-2xl overflow-hidden z-50"
        style={{
          ...glassStyle(theme),
          width: "260px",
          transformOrigin: "top left",
          transform:   open ? "scale(1) translateY(0)"     : "scale(0.92) translateY(-8px)",
          opacity:     open ? 1                            : 0,
          pointerEvents: open ? "auto"                    : "none",
          transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease",
        }}
      >
        {/* header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}
        >
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110"
            style={{ color: theme.textMuted, background: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span
            className="text-xs font-bold tracking-wide"
            style={{ backgroundImage: accentGrad, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            {MONTHS[viewM]} {viewY}
          </span>

          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110"
            style={{ color: theme.textMuted, background: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* day-of-week headers */}
        <div className="grid grid-cols-7 px-3 pt-2 pb-1">
          {DAYS.map((d, i) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold pb-1"
              style={{ color: isWeekend(i) ? theme.statValue : theme.textMuted, opacity: 0.7 }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* day cells */}
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />;
            const today   = isToday(d);
            const weekend = isWeekend(i);
            return (
              <div
                key={`d-${i}`}
                className="group flex items-center justify-center"
                style={{ height: "30px" }}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold cursor-default transition-all duration-200 group-hover:scale-110"
                  style={today ? {
                    backgroundImage:    accentGrad,
                    color:              "#fff",
                    boxShadow:          "0 2px 10px rgba(0,0,0,0.2)",
                  } : {
                    color:              weekend ? theme.statValue : theme.text,
                    background:         "transparent",
                  }}
                  onMouseEnter={e => {
                    if (today) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.backgroundImage = accentGrad;
                    el.style.color           = "#fff";
                    el.style.boxShadow       = "0 2px 8px rgba(0,0,0,0.18)";
                  }}
                  onMouseLeave={e => {
                    if (today) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.backgroundImage = "";
                    el.style.color           = weekend ? theme.statValue : theme.text;
                    el.style.boxShadow       = "";
                  }}
                >
                  {d}
                </span>
              </div>
            );
          })}
        </div>

        {/* live time footer */}
        <div
          className="px-4 py-2.5 text-center text-xs font-mono font-semibold"
          style={{
            borderTop: `1px solid ${theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"}`,
            backgroundImage: accentGrad,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {timeStr}
        </div>
      </div>
    </div>
  );
}
