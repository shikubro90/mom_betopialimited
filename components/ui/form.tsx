import { cn } from "@/lib/utils";

const BASE =
  "w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:border-transparent transition bg-white";

/**
 * Returns a Tailwind className string for a form input.
 * @param focusRing  e.g. "focus:ring-brand-400" or "focus:ring-emerald-400"
 * @param error      Error message — if present, switches to red border/ring
 */
export function fieldCls(focusRing: string, error?: string): string {
  return cn(
    BASE,
    error ? "border-red-400 focus:ring-red-400" : `border-gray-200 ${focusRing}`
  );
}

/** Renders a red validation error message below a field, or nothing if no error. */
export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-500 font-medium mt-1">{msg}</p>;
}
