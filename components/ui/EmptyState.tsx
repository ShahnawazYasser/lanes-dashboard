import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  hint,
  className,
  children,
}: {
  title: string;
  hint: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-6 py-12 text-center", className)}>
      <p className="text-[16px] font-bold text-ink">{title}</p>
      <p className="max-w-sm text-[13px] text-ink-2">{hint}</p>
      {children}
    </div>
  );
}
