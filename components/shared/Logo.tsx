import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { icon: "w-6 h-6 text-sm", text: "text-base" },
  md: { icon: "w-8 h-8 text-base", text: "text-xl" },
  lg: { icon: "w-12 h-12 text-xl", text: "text-3xl" },
};

export function Logo({ size = "md", className }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-xl bg-hero-gradient flex items-center justify-center font-bold text-white",
          s.icon
        )}
      >
        M
      </div>
      <span className={cn("font-bold tracking-tight text-gray-900", s.text)}>
        MoM<span className="gradient-text">Betopia</span>
      </span>
    </div>
  );
}
