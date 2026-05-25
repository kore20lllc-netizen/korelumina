import { cn } from "@/lib/utils";

interface BlobsProps {
  variant?: "hero" | "ambient" | "soft";
  className?: string;
}

/**
 * Floating gradient blobs — pure CSS, GPU-friendly.
 * Provides the signature Lumina background depth.
 */
export function Blobs({ variant = "ambient", className }: BlobsProps) {
  const intensity = variant === "hero" ? 0.85 : variant === "soft" ? 0.35 : 0.55;
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div
        className="blob drift pulse-glow"
        style={{
          top: "-10%", left: "-8%", width: "55vw", height: "55vw",
          background: "radial-gradient(circle at 30% 30%, hsl(var(--magenta)), hsl(var(--violet)) 55%, transparent 70%)",
          opacity: intensity,
        }}
      />
      <div
        className="blob float-slow"
        style={{
          top: "20%", right: "-12%", width: "50vw", height: "50vw",
          background: "radial-gradient(circle at 50% 50%, hsl(var(--electric)), hsl(var(--cyan)) 55%, transparent 70%)",
          opacity: intensity * 0.85,
          animationDelay: "-3s",
        }}
      />
      <div
        className="blob float-slower"
        style={{
          bottom: "-15%", left: "20%", width: "45vw", height: "45vw",
          background: "radial-gradient(circle at 40% 60%, hsl(var(--rose)), hsl(var(--gold) / 0.7) 50%, transparent 70%)",
          opacity: intensity * 0.7,
          animationDelay: "-7s",
        }}
      />
      {variant === "hero" && (
        <div
          className="blob drift"
          style={{
            top: "30%", left: "35%", width: "30vw", height: "30vw",
            background: "radial-gradient(circle, hsl(var(--cyan) / 0.9), transparent 70%)",
            opacity: 0.5,
            animationDelay: "-12s",
          }}
        />
      )}
    </div>
  );
}
