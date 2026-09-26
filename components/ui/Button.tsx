import { cn } from "@/lib/cn";

export type ButtonVariant = "default" | "primary" | "danger" | "whatsapp";
export type ButtonSize = "md" | "sm";

const VARIANT: Record<ButtonVariant, string> = {
  default: "bg-surface border border-line text-ink hover:bg-surface-2",
  primary: "bg-brand border border-brand text-brand-ink hover:opacity-90",
  danger: "bg-surface border border-line text-stop hover:bg-stop-bg",
  whatsapp: "bg-transparent border border-go text-go hover:bg-go-bg",
};

const SIZE: Record<ButtonSize, string> = {
  md: "h-10 px-4 text-[15px]",
  sm: "h-8 px-3 text-[13px]",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsAnchor = CommonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M10 2a8 8 0 0 0-6.9 12l-1 3.6 3.7-1A8 8 0 1 0 10 2Zm0 1.6a6.4 6.4 0 0 1 5.5 9.7l-.2.3.6 2.1-2.2-.6-.3.2A6.4 6.4 0 1 1 10 3.6Zm-2.6 3c-.2 0-.4.1-.6.3-.2.2-.7.7-.7 1.6s.7 1.9.8 2c.1.1 1.4 2.2 3.4 3 2 .9 2 .6 2.4.5.4 0 1.2-.5 1.4-1s.2-.9.1-1c-.1-.1-.2-.2-.5-.3l-1.4-.7c-.2-.1-.3-.1-.5.1l-.5.7c-.1.1-.2.1-.4 0-.2-.1-.9-.3-1.7-1.1-.6-.6-1-1.3-1.2-1.5-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4l-.6-1.5c-.2-.4-.4-.4-.5-.4Z" />
    </svg>
  );
}

export function Button(props: ButtonProps) {
  const { variant = "default", size = "md", className, children, ...rest } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-1.5 rounded font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
    VARIANT[variant],
    SIZE[size],
    className,
  );

  const glyph = variant === "whatsapp" ? <WhatsAppGlyph /> : null;

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a href={href} className={classes} {...anchorRest}>
        {glyph}
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {glyph}
      {children}
    </button>
  );
}
