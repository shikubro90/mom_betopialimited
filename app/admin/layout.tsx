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
          MeetBrief Admin
        </span>
        <LogoutButton />
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
