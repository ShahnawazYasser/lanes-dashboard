"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipVariant } from "@/components/ui/Chip";
import { Lamp } from "@/components/ui/Lamp";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpacesTimeline } from "@/components/SpacesTimeline";
import { ContractDrawer } from "@/components/contracts/ContractDrawer";
import { ProspectDrawer } from "@/components/prospects/ProspectDrawer";
import { useData, type ProspectWithComments } from "@/lib/data/DataProvider";
import { light, needsDecision, weeksLabel, weeksLeft, type Light } from "@/lib/contracts";
import { daysSince } from "@/lib/prospects";
import { fmtDate, waLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Contract, ProspectStatus, RenewalStatus } from "@/types/db";

const LIGHT_TILES: { value: Light; label: string }[] = [
  { value: "stop", label: "Under 4 weeks" },
  { value: "hold", label: "4 to 8 weeks" },
  { value: "go", label: "8+ weeks" },
];

const RENEWAL_VARIANT: Record<RenewalStatus, ChipVariant> = {
  Leaving: "stop",
  Renewing: "go",
  "In talks": "hold",
  "Not discussed": "neutral",
};

const STATUS_VARIANT: Record<ProspectStatus, ChipVariant> = {
  Replied: "go",
  "No reply": "hold",
  Converted: "quiet",
  "Not contacted": "neutral",
};

function listJoin(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function OverviewView() {
  const { contracts, prospects } = useData();
  const [tab, setTab] = useState<"contracts" | "prospects">("contracts");
  const [contractDrawer, setContractDrawer] = useState<{
    open: boolean;
    initial: Partial<Contract> | null;
  }>({ open: false, initial: null });
  const [prospectDrawer, setProspectDrawer] = useState<{
    open: boolean;
    initial: ProspectWithComments | null;
  }>({ open: false, initial: null });

  function openContract(c: Contract) {
    setContractDrawer({ open: true, initial: c });
  }
  function openProspect(p: ProspectWithComments) {
    setProspectDrawer({ open: true, initial: p });
  }

  const needing = useMemo(() => contracts.filter(needsDecision), [contracts]);

  const headline = useMemo(() => {
    if (needing.length === 0) return "Every contract is either safe or renewing.";
    if (needing.length === 1) return `${needing[0].brand} needs a renewal decision.`;
    return `${needing.length} contracts need a renewal decision.`;
  }, [needing]);

  const subLine = useMemo(() => {
    const redBrands = needing.filter((c) => light(c) === "stop").map((c) => c.brand);
    const redSentence = redBrands.length
      ? `${listJoin(redBrands)} end${redBrands.length === 1 ? "s" : ""} in under four weeks.`
      : "";

    const leaving = [...contracts]
      .filter((c) => c.renewal_status === "Leaving")
      .sort((a, b) => weeksLeft(a) - weeksLeft(b))[0];
    let leavingSentence = "";
    if (leaving) {
      const n = prospects.filter(
        (p) => p.space && p.space === leaving.space && p.join_date && p.status !== "Converted",
      ).length;
      leavingSentence = `${leaving.brand} is leaving ${leaving.space || "its space"} on ${fmtDate(leaving.end_date)}, and ${n} prospect${n === 1 ? "" : "s"} have asked for it.`;
    }

    return [redSentence, leavingSentence].filter(Boolean).join(" ");
  }, [needing, contracts, prospects]);

  const counts = useMemo(() => {
    const c: Record<Light, number> = { stop: 0, hold: 0, go: 0 };
    for (const contract of contracts) c[light(contract)]++;
    return c;
  }, [contracts]);

  const attentionContracts = useMemo(() => {
    return [...contracts]
      .filter((c) => light(c) !== "go")
      .sort((a, b) => {
        const aR = a.renewal_status === "Renewing";
        const bR = b.renewal_status === "Renewing";
        if (aR !== bR) return aR ? 1 : -1;
        return weeksLeft(a) - weeksLeft(b);
      });
  }, [contracts]);
  const renewingCount = attentionContracts.filter((c) => c.renewal_status === "Renewing").length;

  const attentionProspects = useMemo(() => {
    return [...prospects]
      .filter((p) => p.status !== "Converted")
      .sort((a, b) => daysSince(b, b.prospect_comments) - daysSince(a, a.prospect_comments))
      .slice(0, 8);
  }, [prospects]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-extrabold text-ink min-[640px]:text-[26px]">{headline}</h1>
        {subLine ? <p className="text-[14px] text-ink-2">{subLine}</p> : null}
      </div>

      <Panel className="grid grid-cols-3 divide-x divide-line overflow-hidden">
        {LIGHT_TILES.map((tile) => (
          <Link
            key={tile.value}
            href={`/contracts?light=${tile.value}`}
            className="flex flex-col items-center gap-1.5 px-3 py-4 text-center hover:bg-surface-2"
          >
            <span className="text-[26px] font-extrabold leading-none text-ink">{counts[tile.value]}</span>
            <Lamp variant={tile.value} className="h-[22px] w-[22px] scale-125" />
            <span className="text-[12px] text-ink-2">{tile.label}</span>
          </Link>
        ))}
      </Panel>

      <Panel className="p-4">
        <div className="mb-3 flex gap-1 rounded-sm border border-line p-0.5 min-[1024px]:hidden">
          <button
            type="button"
            onClick={() => setTab("contracts")}
            className={cn(
              "flex-1 rounded-[4px] px-3 py-1.5 text-[13px] font-medium",
              tab === "contracts" ? "bg-brand text-brand-ink" : "text-ink-2",
            )}
          >
            Contracts
          </button>
          <button
            type="button"
            onClick={() => setTab("prospects")}
            className={cn(
              "flex-1 rounded-[4px] px-3 py-1.5 text-[13px] font-medium",
              tab === "prospects" ? "bg-brand text-brand-ink" : "text-ink-2",
            )}
          >
            Prospects
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[1024px]:grid-cols-2">
          <div className={cn("flex flex-col", tab !== "contracts" && "max-[1023px]:hidden")}>
            <h3 className="mb-2 hidden text-[13px] font-semibold text-ink-2 min-[1024px]:block">
              Contracts
            </h3>
            {attentionContracts.length === 0 ? (
              <EmptyState title="Nothing ending in the next 8 weeks" hint="" />
            ) : (
              <div className="flex flex-col rounded-sm border border-line">
                {attentionContracts.map((c) => (
                  <AttentionContractRow
                    key={c.id}
                    contract={c}
                    onOpen={() => openContract(c)}
                  />
                ))}
              </div>
            )}
            <p className="mt-2 text-[12px] text-ink-3">
              {renewingCount} marked Renewing, so they don&apos;t trigger alerts.
            </p>
          </div>

          <div className={cn("flex flex-col", tab !== "prospects" && "max-[1023px]:hidden")}>
            <h3 className="mb-2 hidden text-[13px] font-semibold text-ink-2 min-[1024px]:block">
              Prospects
            </h3>
            {attentionProspects.length === 0 ? (
              <EmptyState title="No open prospects" hint="" />
            ) : (
              <div className="flex flex-col rounded-sm border border-line">
                {attentionProspects.map((p) => (
                  <AttentionProspectRow
                    key={p.id}
                    prospect={p}
                    onOpen={() => openProspect(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>

      <SpacesTimeline onOpenContract={openContract} onOpenProspect={openProspect} />

      <ContractDrawer
        open={contractDrawer.open}
        initial={contractDrawer.initial}
        onClose={() => setContractDrawer({ open: false, initial: null })}
      />
      <ProspectDrawer
        open={prospectDrawer.open}
        initial={prospectDrawer.initial}
        onClose={() => setProspectDrawer({ open: false, initial: null })}
        onConvert={(prefill) => setContractDrawer({ open: true, initial: prefill })}
      />
    </div>
  );
}

const WIDE_ONLY = "hidden min-[401px]:flex min-[1024px]:hidden";
const COMPACT_ONLY = "flex min-[401px]:hidden min-[1024px]:flex";

function AttentionContractRow({ contract, onOpen }: { contract: Contract; onOpen: () => void }) {
  const l = light(contract);
  const renewing = contract.renewal_status === "Renewing";

  return (
    <div
      onClick={onOpen}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-surface-2",
        renewing && "opacity-[0.62]",
      )}
    >
      <Lamp variant={l} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-ink">{contract.brand}</div>
        <div className={cn("min-w-0 flex-col gap-0.5 text-[12px] text-ink-3", COMPACT_ONLY)}>
          <span className="truncate">
            {contract.space || "—"} · {weeksLabel(contract)} · {contract.renewal_status} ·{" "}
            {contract.owner || "—"}
          </span>
        </div>
        <div className={cn("items-center gap-1.5 text-[12px] text-ink-3", WIDE_ONLY)}>
          <span className="truncate">{contract.space || "—"}</span>
        </div>
      </div>
      <div className={cn("shrink-0 items-center gap-1.5", WIDE_ONLY)}>
        <div className="text-right">
          <div className="text-[13px] font-bold text-ink">{weeksLabel(contract)}</div>
          <div className="text-[11px] text-ink-3">{fmtDate(contract.end_date)}</div>
        </div>
        <Chip variant={RENEWAL_VARIANT[contract.renewal_status]}>{contract.renewal_status}</Chip>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {contract.phone ? (
          <Button
            variant="whatsapp"
            size="sm"
            href={waLink(contract.phone)}
            target="_blank"
            rel="noreferrer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            WhatsApp
          </Button>
        ) : null}
        <Button
          variant="default"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Open
        </Button>
      </div>
    </div>
  );
}

function AttentionProspectRow({
  prospect,
  onOpen,
}: {
  prospect: ProspectWithComments;
  onOpen: () => void;
}) {
  const days = daysSince(prospect, prospect.prospect_comments);

  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-2.5 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-ink">{prospect.name}</div>
        <div className={cn(COMPACT_ONLY, "flex-col gap-0.5 text-[12px] text-ink-3")}>
          <span className="truncate">
            {prospect.category || "—"} · {prospect.status} · {days}d since contact
            {prospect.join_date ? ` · ${fmtDate(prospect.join_date)}` : ""}
          </span>
        </div>
        <div className={cn(WIDE_ONLY, "items-center gap-1.5 text-[12px] text-ink-3")}>
          <span className="truncate">{prospect.category || "—"}</span>
        </div>
      </div>
      <div className={cn(WIDE_ONLY, "shrink-0 items-center gap-2")}>
        <Chip variant={STATUS_VARIANT[prospect.status]}>{prospect.status}</Chip>
        <div className="text-right text-[12px] text-ink-3">
          <div className="font-bold text-ink">{days}d</div>
          {prospect.join_date ? <div>{fmtDate(prospect.join_date)}</div> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {prospect.phone ? (
          <Button
            variant="whatsapp"
            size="sm"
            href={waLink(prospect.phone)}
            target="_blank"
            rel="noreferrer"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            WhatsApp
          </Button>
        ) : null}
        <Button
          variant="default"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Log
        </Button>
      </div>
    </div>
  );
}
