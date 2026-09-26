import { cn } from "@/lib/cn";

/** Shared styling for native input/select/textarea controls used inside a Field. */
export const fieldControlClass =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2";

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint ? <span className="text-[12.5px] text-ink-3">{hint}</span> : null}
    </div>
  );
}
