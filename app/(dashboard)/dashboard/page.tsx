export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Your meeting summaries at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Total Briefs", "This Week", "Pending"].map((label, i) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold text-brand-600 mt-1">
              {[0, 0, 0][i]}
            </p>
          </div>
        ))}
      </div>

      {/* Feature panels will go here */}
    </div>
  );
}
