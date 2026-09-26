"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

const LENGTH = 4;

export function PinPad({ next }: { next: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function reset() {
    setDigits(Array(LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }

  async function submit(pin: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "That PIN isn't right. Try again.");
        reset();
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);

    if (digit && index < LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === LENGTH - 1 && nextDigits.every((d) => d !== "")) {
      submit(nextDigits.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3" role="group" aria-label="PIN">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={1}
            value={digit}
            disabled={submitting}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            className={cn(
              "h-14 w-12 rounded-sm border border-line bg-surface text-center text-[22px] font-semibold text-ink",
              "focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2",
              error && "border-stop",
            )}
          />
        ))}
      </div>
      {error ? <p className="text-[13px] font-medium text-stop">{error}</p> : null}
    </div>
  );
}
