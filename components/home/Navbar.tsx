import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-600 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-500 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
