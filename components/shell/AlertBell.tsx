"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data/DataProvider";
import { alertCount, buildDigest, digestSubject, todayLabel } from "@/lib/digest";
import { renderDigestEmailHtml } from "@/lib/digestEmail";
import { Modal } from "@/components/ui/Modal";

export function AlertBell() {
  const { contracts, prospects } = useData();
  const [open, setOpen] = useState(false);

  const count = alertCount(contracts);

  // Same buildDigest()/renderDigestEmailHtml() the /api/digest cron route
  // calls, so this preview is exactly what lands in the inbox.
  const { subject, html } = useMemo(() => {
    const dateLabel = todayLabel();
    const data = buildDigest(contracts, prospects);
    return {
      subject: digestSubject(data, dateLabel),
      html: renderDigestEmailHtml(data, dateLabel),
    };
  }, [contracts, prospects]);

  return (
    <>
      <button
        type="button"
        aria-label={count > 0 ? `Alerts, ${count} need attention` : "Alerts"}
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            d="M6 10a6 6 0 1 1 12 0c0 3.6 1 5 1.5 5.8H4.5C5 15 6 13.6 6 10Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10 18.5a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {count > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stop px-1 text-[10px] font-bold leading-none text-white">
            {count}
          </span>
        ) : null}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Daily digest preview" size="lg">
        <p className="mb-3 text-[13px] text-ink-2">
          Subject: <span className="font-medium text-ink">{subject}</span>
        </p>
        <iframe
          title="Daily digest email preview"
          srcDoc={html}
          className="h-[60vh] w-full rounded border border-line bg-white"
        />
      </Modal>
    </>
  );
}
