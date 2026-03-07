import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { LayoutDashboard, FileText, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Briefs",    href: "/briefs",    icon: FileText },
  { label: "Settings",  href: "/settings",  icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 border-r bg-white shrink-0">
      <div className="h-14 flex items-center px-5 border-b">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-brand-600 transition-colors"
        >
          Admin
        </Link>
      </div>
    </aside>
  );
}
