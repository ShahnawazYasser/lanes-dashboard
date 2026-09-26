import { cn } from "@/lib/cn";

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface shadow-panel",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
