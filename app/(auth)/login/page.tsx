import { Logo } from "@/components/shared/Logo";

export const metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-sm space-y-6 bg-white rounded-2xl shadow-xl border border-brand-100 p-8">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        {/* Auth form will go here */}
        <p className="text-center text-xs text-muted-foreground">Auth coming soon.</p>
      </div>
    </main>
  );
}
