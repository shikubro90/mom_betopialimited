import Link            from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-400 uppercase tracking-widest">
          MoMBetopia Admin
        </span>
        <LogoutButton />
      </nav>

      {/* Tab navigation */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1 max-w-6xl mx-auto">
          <Link
            href="/superadmin"
            className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-100 hover:border-b-2 hover:border-brand-400 transition-colors"
          >
            Summaries
          </Link>
          <Link
            href="/superadmin/contacts"
            className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-100 hover:border-b-2 hover:border-brand-400 transition-colors"
          >
            Contacts
          </Link>
          <Link
            href="/superadmin/users"
            className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-100 hover:border-b-2 hover:border-brand-400 transition-colors"
          >
            Users
          </Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
