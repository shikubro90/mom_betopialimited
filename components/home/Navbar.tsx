import { Logo } from "@/components/shared/Logo";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
        <Logo size="sm" />
      </div>
    </nav>
  );
}
