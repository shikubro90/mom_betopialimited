"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  message:   string;
  type?:     "success" | "error" | "warning";
  onClose:   () => void;
  duration?: number;
}

const CONFIG = {
  success: {
    bar:    "from-emerald-400 to-teal-400",
    icon:   <CheckCircle   className="w-5 h-5 text-emerald-400" />,
    glow:   "shadow-emerald-900/40",
    close:  "text-emerald-500 hover:text-white",
  },
  error: {
    bar:    "from-rose-500 to-red-400",
    icon:   <XCircle       className="w-5 h-5 text-rose-400" />,
    glow:   "shadow-rose-900/40",
    close:  "text-rose-500 hover:text-white",
  },
  warning: {
    bar:    "from-amber-400 to-orange-400",
    icon:   <AlertTriangle className="w-5 h-5 text-amber-400" />,
    glow:   "shadow-amber-900/40",
    close:  "text-amber-500 hover:text-white",
  },
};

export function Toast({ message, type = "success", onClose, duration = 6000 }: Props) {
  const [visible,  setVisible]  = useState(false);
  const [progress, setProgress] = useState(100);

  const cfg = CONFIG[type];

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => { setVisible(false); setTimeout(onClose, 350); }, duration);

    // Shrink progress bar
    const step  = 100 / (duration / 50);
    const timer = setInterval(() => setProgress((p) => Math.max(0, p - step)), 50);

    return () => { clearTimeout(show); clearTimeout(hide); clearInterval(timer); };
  }, [duration, onClose]);

  const dismiss = () => { setVisible(false); setTimeout(onClose, 350); };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 overflow-hidden",
        "rounded-2xl border border-white/10 bg-[#0f0f12]/95 backdrop-blur-xl",
        "shadow-2xl",
        cfg.glow,
        "transition-all duration-350 ease-out",
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-5 scale-95"
      )}
    >
      {/* top accent line */}
      <div className={cn("h-[2px] w-full bg-gradient-to-r", cfg.bar)} />

      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* icon with subtle glow ring */}
        <div className="mt-0.5 shrink-0">{cfg.icon}</div>

        <p className="flex-1 text-sm font-medium leading-snug text-white/90">{message}</p>

        <button
          onClick={dismiss}
          className={cn("mt-0.5 shrink-0 transition-colors", cfg.close)}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* progress bar */}
      <div className="h-[3px] w-full bg-white/5">
        <div
          className={cn("h-full bg-gradient-to-r transition-all ease-linear", cfg.bar)}
          style={{ width: `${progress}%`, transitionDuration: "50ms" }}
        />
      </div>
    </div>
  );
}
