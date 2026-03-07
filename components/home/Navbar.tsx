import Link from "next/link";
import { Shield } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Logo size="sm" />
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all"
        >
          <Shield className="w-3.5 h-3.5" />
          Admin
        </Link>
      </div>
    </nav>
  );
}
