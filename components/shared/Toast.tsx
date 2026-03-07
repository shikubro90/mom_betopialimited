"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  message:   string;
  type?:     "success" | "error";
  onClose:   () => void;
  duration?: number;
}

export function Toast({ message, type = "success", onClose, duration = 4000 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [duration, onClose]);

  const dismiss = () => { setVisible(false); setTimeout(onClose, 300); };

  const isError = type === "error";

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 max-w-sm",
        "rounded-xl shadow-2xl px-5 py-3.5 border transition-all duration-300",
        isError
          ? "bg-red-950 border-red-800 text-red-100"
          : "bg-gray-900 border-gray-700 text-white",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {isError
        ? <XCircle    className="w-5 h-5 text-red-400 shrink-0" />
        : <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={dismiss}
        className={cn(
          "ml-1 transition-colors",
          isError ? "text-red-500 hover:text-red-200" : "text-gray-400 hover:text-white"
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
