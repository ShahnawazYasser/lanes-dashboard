"use client";

import { useMemo } from "react";
import { Panel } from "@/components/ui/Panel";
import { useData, type ProspectWithComments } from "@/lib/data/DataProvider";
import { light } from "@/lib/contracts";
import { fmtDate, parseDateOnly, todayKarachi } from "@/lib/format";
import { naturalCompare } from "@/lib/spaces";
import { SEASON_BANDS } from "@/lib/seasons";
import { cn } from "@/lib/cn";
import type { Contract } from "@/types/db";

const MONTHS = 7;
const NO_SPACE = "__NO_SPACE__";

function monthStartUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function addMonthsUTC(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

export function SpacesTimeline({
  onOpenContract,
  onOpenProspect,
}: {
  onOpenContract: (contract: Contract) => void;
  onOpenProspect: (prospect: ProspectWithComments) => void;
}) {
  const { contracts, prospects } = useData();

  const rangeStart = useMemo(() => monthStartUTC(todayKarachi()), []);
  const rangeEnd = useMemo(() => addMonthsUTC(rangeStart, MONTHS), [rangeStart]);
  const span = rangeEnd.getTime() - rangeStart.getTime();
  const today = todayKarachi();

  function pct(date: Date): number {
    const raw = ((date.getTime() - rangeStart.getTime()) / span) * 100;
    return Math.min(100, Math.max(0, raw));
  }
  function pctDate(dateStr: string): number {
    return pct(parseDateOnly(dateStr));
  }

  const months = useMemo(() => {
    const arr: { label: string; leftPct: number }[] = [];
    for (let i = 0; i < MONTHS; i++) {
      const m = addMonthsUTC(rangeStart, i);
      arr.push({
        label: m.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
        leftPct: pct(m),
      });
    }
    return arr;
  }, [rangeStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const set = new Set<string>();
    for (const c of contracts) if (c.space) set.add(c.space);
    for (const p of prospects) if (p.space && !set.has(p.space)) set.add(p.space);
    const spaces = Array.from(set).sort(naturalCompare);
    const hasNoSpace = prospects.some((p) => p.join_date && !p.space);
    return hasNoSpace ? [...spaces, NO_SPACE] : spaces;
  }, [contracts, prospects]);

  return (
    <Panel className="flex flex-col gap-3 p-4">
      <div className="overflow-x-auto">
        <div style={{ width: "100%", minWidth: 820 }}>
          {/* Header */}
          <div className="flex border-b border-line pb-1.5">
            <div className="w-[150px] shrink-0" />
            <div className="relative h-6 flex-1">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-dashed border-line pl-1.5 text-[11px] font-medium text-ink-3"
                  style={{ left: `${m.leftPct}%` }}
                >
                  {m.label}
                </div>
              ))}
              {SEASON_BANDS.map((b) => (
                <div
                  key={b.label}
                  className="absolute top-0 whitespace-nowrap text-[10px] text-season-ink"
                  style={{ left: `${pctDate(b.start)}%` }}
                >
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 flex">
              <div className="w-[150px] shrink-0" />
              <div className="relative flex-1">
                {SEASON_BANDS.map((b) => {
                  const left = pctDate(b.start);
                  const right = pctDate(b.end);
                  return (
                    <div
                      key={b.label}
                      className="absolute top-0 bottom-0 bg-season"
                      style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
                    />
                  );
                })}
                <div
                  className="absolute top-0 bottom-0 w-px bg-ink"
                  style={{ left: `${pct(today)}%` }}
                />
              </div>
            </div>

            <div className="relative flex flex-col">
              {rows.map((space) => (
                <TimelineRow
                  key={space}
                  space={space}
                  contracts={space === NO_SPACE ? [] : contracts.filter((c) => c.space === space)}
                  prospects={
                    space === NO_SPACE
                      ? prospects.filter((p) => p.join_date && !p.space)
                      : prospects.filter((p) => p.space === space && p.join_date)
                  }
                  pctDate={pctDate}
                  pct={pct}
                  rangeStart={rangeStart}
                  onOpenContract={onOpenContract}
                  onOpenProspect={onOpenProspect}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Legend />
    </Panel>
  );
}

function TimelineRow({
  space,
  contracts,
  prospects,
  pctDate,
  pct,
  rangeStart,
  onOpenContract,
  onOpenProspect,
}: {
  space: string;
  contracts: Contract[];
  prospects: ProspectWithComments[];
  pctDate: (d: string) => number;
  pct: (d: Date) => number;
  rangeStart: Date;
  onOpenContract: (c: Contract) => void;
  onOpenProspect: (p: ProspectWithComments) => void;
}) {
  const tall = prospects.length > 1;
  const rowH = tall ? 88 : 60;
  const today = todayKarachi();
  const current =
    contracts.find((c) => {
      const start = c.start_date ? parseDateOnly(c.start_date) : null;
      const end = parseDateOnly(c.end_date);
      return (!start || start <= today) && end >= today;
    }) ?? contracts[0];

  return (
    <div className="flex border-b border-line last:border-b-0" style={{ minHeight: rowH }}>
      <div className="sticky left-0 z-10 flex w-[150px] shrink-0 flex-col justify-center gap-0.5 bg-surface px-2 py-2">
        <div className="text-[13.5px] font-bold text-ink">{space === NO_SPACE ? "—" : space}</div>
        <div className="truncate text-[12px] text-ink-3">
          {space === NO_SPACE ? "No space yet" : current ? current.brand : "Empty"}
        </div>
      </div>
      <div className="relative flex-1 py-2">
        {contracts.map((c) => (
          <ContractBar
            key={c.id}
            contract={c}
            pctDate={pctDate}
            pct={pct}
            rangeStart={rangeStart}
            onOpen={() => onOpenContract(c)}
          />
        ))}
        {prospects.map((p, i) => (
          <ProspectPin
            key={p.id}
            prospect={p}
            leftPct={pctDate(p.join_date!)}
            high={prospects.length > 1 ? i % 2 === 0 : true}
            onOpen={() => onOpenProspect(p)}
          />
        ))}
      </div>
    </div>
  );
}

function ContractBar({
  contract,
  pctDate,
  pct,
  rangeStart,
  onOpen,
}: {
  contract: Contract;
  pctDate: (d: string) => number;
  pct: (d: Date) => number;
  rangeStart: Date;
  onOpen: () => void;
}) {
  const l = light(contract);
  const startDate = contract.start_date ? parseDateOnly(contract.start_date) : rangeStart;
  const clipped = startDate.getTime() <= rangeStart.getTime();
  const leftPct = pct(startDate);
  const endPct = pctDate(contract.end_date);
  const widthPct = Math.max(0.5, endPct - leftPct);
  const renewing = contract.renewal_status === "Renewing";
  const leaving = contract.renewal_status === "Leaving";

  const bg = l === "go" ? "var(--go)" : l === "hold" ? "var(--hold)" : "var(--stop)";

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "absolute top-3 flex h-6 items-center overflow-hidden px-1.5 text-[11px] font-medium text-white shadow-sm",
          clipped ? "rounded-l-none" : "rounded-l-sm",
          "rounded-r-sm",
        )}
        style={{
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          backgroundColor: bg,
          backgroundImage: renewing
            ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.4) 0 6px, transparent 6px 12px)"
            : undefined,
        }}
        title={`${contract.brand}, ${fmtDate(contract.end_date)}`}
      >
        <span className="truncate">
          {contract.brand}, {renewing ? "renewing" : fmtDate(contract.end_date).slice(0, 5)}
        </span>
      </button>
      {leaving ? (
        <button
          type="button"
          onClick={onOpen}
          className="absolute top-3 flex h-6 items-center overflow-hidden rounded-r-sm border border-dashed border-ink-3 px-1.5 text-[11px] text-ink-2"
          style={{ left: `${endPct}%`, width: `${Math.max(0.5, 100 - endPct)}%` }}
          title={`Opens ${fmtDate(contract.end_date)}`}
        >
          <span className="truncate">Opens {fmtDate(contract.end_date)}</span>
        </button>
      ) : null}
    </>
  );
}

function ProspectPin({
  prospect,
  leftPct,
  high,
  onOpen,
}: {
  prospect: ProspectWithComments;
  leftPct: number;
  high: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="absolute flex flex-col items-center gap-1"
      style={{ left: `${leftPct}%`, top: high ? 40 : 64 }}
    >
      <span
        className="h-2.5 w-2.5 rotate-45 border border-brand bg-surface"
        aria-hidden="true"
      />
      <span className="whitespace-nowrap rounded-sm bg-surface px-1 text-[10.5px] text-ink-2 shadow-sm">
        {prospect.name}
      </span>
    </button>
  );
}

function Legend() {
  const approximate = SEASON_BANDS.some((b) => b.approximate);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[12px] text-ink-2">
      <LegendSwatch color="var(--stop)" label="Under 4 weeks" />
      <LegendSwatch color="var(--hold)" label="4 to 8 weeks" />
      <LegendSwatch color="var(--go)" label="8+ weeks" />
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2.5 w-4 rounded-sm border border-line"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(30,77,70,0.4) 0 4px, transparent 4px 8px)",
          }}
        />
        Renewing
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm border border-dashed border-ink-3" />
        Space opening
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm bg-season" />
        Season{approximate ? " (Ramadan and Eid dates approximate)" : ""}
      </span>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
