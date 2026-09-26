"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";
import { AlertBell } from "./AlertBell";

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.02em] text-ink">
      Lanes
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-go" />
        <span className="h-1.5 w-1.5 rounded-full bg-hold" />
        <span className="h-1.5 w-1.5 rounded-full bg-stop" />
      </span>
    </Link>
  );
}

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface pt-[var(--safe-top)]">
      <div className="mx-auto flex h-14 w-full max-w-[var(--container-max)] items-center justify-between gap-4 px-4 min-[1024px]:px-6">
        <Wordmark />
        <nav className="hidden min-[760px]:flex min-[760px]:items-center min-[760px]:gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13.5px] font-medium",
                  active ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <AlertBell />
      </div>
    </header>
  );
}
