import { cn } from "@/lib/cn";

export type LampVariant = "go" | "hold" | "stop" | "off";

const DOT: Record<LampVariant, string> = {
  go: "bg-go",
  hold: "bg-hold",
  stop: "bg-stop",
  off: "bg-ink-3",
};

const HALO: Record<LampVariant, string> = {
  go: "bg-go-bg",
  hold: "bg-hold-bg",
  stop: "bg-stop-bg",
  off: "bg-transparent",
};

const LABEL: Record<LampVariant, string> = {
  go: "On track",
  hold: "Needs attention soon",
  stop: "Needs attention now",
  off: "No status",
};

export function Lamp({
  variant,
  label,
  className,
}: {
  variant: LampVariant;
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label ?? LABEL[variant]}
      className={cn("relative inline-flex h-3 w-3 shrink-0 items-center justify-center", className)}
    >
      <span className={cn("absolute inline-block h-5 w-5 rounded-full", HALO[variant])} />
      <span className={cn("relative inline-block h-3 w-3 rounded-full", DOT[variant])} />
    </span>
  );
}
