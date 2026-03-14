"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Contact { id: string; name: string; email: string; }

/**
 * Searches the employee directory on the server.
 * Returns a `search(q)` function — debounced, queries /api/contacts?q=
 * and a `suggestions` array for the latest result.
 */
export function useContactSearch() {
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    // Empty string clears, but a space " " (used on focus) fetches all
    if (q === "") { setSuggestions([]); return; }

    timer.current = setTimeout(async () => {
      try {
        const trimmed = q.trim();
        const url = trimmed
          ? `/api/contacts?q=${encodeURIComponent(trimmed)}`
          : `/api/contacts`;
        const res = await fetch(url);
        if (!res.ok) { setSuggestions([]); return; }
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      }
    }, 120); // 120ms debounce
  }, []);

  const clear = useCallback(() => setSuggestions([]), []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { suggestions, search, clear };
}
