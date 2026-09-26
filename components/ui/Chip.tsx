import { cn } from "@/lib/cn";

export type ChipVariant = "neutral" | "go" | "hold" | "stop" | "quiet";

const VARIANT: Record<ChipVariant, string> = {
  neutral: "bg-surface-2 text-ink border border-line",
  go: "bg-go-bg text-go",
  hold: "bg-hold-bg text-hold",
  stop: "bg-stop-bg text-stop",
  quiet: "bg-transparent text-ink-3 border border-line",
};

export function Chip({
  variant = "neutral",
  className,
  children,
}: {
  variant?: ChipVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium leading-none",
        VARIANT[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
