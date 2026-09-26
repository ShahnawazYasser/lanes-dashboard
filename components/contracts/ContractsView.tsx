"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipVariant } from "@/components/ui/Chip";
import { Lamp } from "@/components/ui/Lamp";
import { EmptyState } from "@/components/ui/EmptyState";
import { fieldControlClass } from "@/components/ui/Field";
import { ContractDrawer } from "./ContractDrawer";
import { useData } from "@/lib/data/DataProvider";
import { light, weeksLabel, weeksLeft, type Light } from "@/lib/contracts";
import { fmtDate, fmtPKR, waLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Contract, RenewalStatus } from "@/types/db";

const LIGHT_TABS: { value: Light | "all"; label: string }[] = [
  { value: "all", label: "All" },
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

type SortKey = "brand" | "space" | "ends";

function compareContracts(a: Contract, b: Contract, key: SortKey, dir: 1 | -1): number {
  let cmp = 0;
  if (key === "brand") cmp = a.brand.localeCompare(b.brand);
  else if (key === "space") cmp = a.space.localeCompare(b.space);
  else cmp = weeksLeft(a) - weeksLeft(b);
  return cmp * dir;
}

export function ContractsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { contracts } = useData();

  const lightFilter = (searchParams.get("light") as Light | null) ?? "all";
  const categoryFilter = searchParams.get("category") ?? "";

  const [groupByCategory, setGroupByCategory] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("ends");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [drawer, setDrawer] = useState<{ open: boolean; initial: Partial<Contract> | null }>({
    open: false,
    initial: null,
  });

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/contracts${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of contracts) if (c.category) set.add(c.category);
    return Array.from(set).sort();
  }, [contracts]);

  const counts = useMemo(() => {
    const c = { stop: 0, hold: 0, go: 0 };
    for (const contract of contracts) c[light(contract)]++;
    return c;
  }, [contracts]);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (lightFilter !== "all" && light(c) !== lightFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      return true;
    });
  }, [contracts, lightFilter, categoryFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareContracts(a, b, sortKey, sortDir)),
    [filtered, sortKey, sortDir],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  const groups = useMemo(() => {
    if (!groupByCategory) return null;
    const map = new Map<string, Contract[]>();
    for (const c of sorted) {
      const key = c.category || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sorted, groupByCategory]);

  function openEdit(c: Contract) {
    setDrawer({ open: true, initial: c });
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-sm border border-line p-0.5">
            {LIGHT_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setParam("light", tab.value === "all" ? "" : tab.value)}
                className={cn(
                  "rounded-[4px] px-3 py-1.5 text-[13px] font-medium",
                  lightFilter === tab.value ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-surface-2",
                )}
              >
                {tab.label}
                {tab.value !== "all" ? ` (${counts[tab.value]})` : ""}
              </button>
            ))}
          </div>

          <select
            className={cn(fieldControlClass, "w-auto")}
            value={categoryFilter}
            onChange={(e) => setParam("category", e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setGroupByCategory((v) => !v)}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-[13px] font-medium",
              groupByCategory
                ? "border-brand bg-brand text-brand-ink"
                : "border-line text-ink-2 hover:bg-surface-2",
            )}
          >
            Group by category
          </button>

          <div className="ml-auto">
            <Button variant="primary" onClick={() => setDrawer({ open: true, initial: null })}>
              Add contract
            </Button>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState title="No contracts match" hint="Try clearing a filter." />
        ) : groups ? (
          <div className="flex flex-col">
            {groups.map(([category, rows]) => {
              const red = rows.filter((r) => light(r) === "stop").length;
              const amber = rows.filter((r) => light(r) === "hold").length;
              return (
                <div key={category}>
                  <div className="border-b border-line bg-surface-2 px-4 py-2 text-[13px] font-semibold text-ink-2">
                    {category} — {rows.length} brand{rows.length === 1 ? "" : "s"}
                    {red > 0 ? `, ${red} red` : ""}
                    {amber > 0 ? `, ${amber} amber` : ""}
                  </div>
                  {rows.map((c) => (
                    <ContractRow key={c.id} contract={c} onOpen={() => openEdit(c)} />
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="hidden min-[861px]:flex items-center gap-x-3 border-b border-line px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">
              <span className="w-[24px]" />
              <SortHeader className="w-[260px]" label="Brand" active={sortKey === "brand"} dir={sortDir} onClick={() => toggleSort("brand")} />
              <SortHeader className="w-[90px]" label="Space" active={sortKey === "space"} dir={sortDir} onClick={() => toggleSort("space")} />
              <SortHeader className="w-[130px]" label="Ends" active={sortKey === "ends"} dir={sortDir} onClick={() => toggleSort("ends")} />
              <span className="w-[120px]">Renewal</span>
              <span className="w-[110px]">Owner</span>
              <span className="w-[170px]">Contact</span>
            </div>
            {sorted.map((c) => (
              <ContractRow key={c.id} contract={c} onOpen={() => openEdit(c)} />
            ))}
          </div>
        )}
      </Panel>

      <ContractDrawer
        open={drawer.open}
        initial={drawer.initial}
        onClose={() => setDrawer({ open: false, initial: null })}
      />
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: 1 | -1;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("inline-flex items-center gap-1 text-left hover:text-ink", className)}
    >
      {label}
      {active ? <span>{dir === 1 ? "↑" : "↓"}</span> : null}
    </button>
  );
}

function ContractRow({
  contract,
  onOpen,
}: {
  contract: Contract;
  onOpen: () => void;
}) {
  const l = light(contract);

  return (
    <div
      onClick={onOpen}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface-2 cursor-pointer"
    >
      <Lamp variant={l} className="shrink-0" />
      <div className="min-w-0 flex-1 min-[861px]:flex-none min-[861px]:w-[260px]">
        <div className="truncate font-semibold text-ink">{contract.brand}</div>
        <div className="truncate text-[12.5px] text-ink-3">
          {contract.category || "—"} · {fmtPKR(contract.rent)}
        </div>
      </div>
      <div className="hidden min-[861px]:block w-[90px] text-[13.5px] text-ink-2">{contract.space || "—"}</div>
      <div className="w-[110px] min-[861px]:w-[130px]">
        <div className="font-bold text-ink text-[14px]">{weeksLabel(contract)}</div>
        <div className="text-[12.5px] text-ink-3">{fmtDate(contract.end_date)}</div>
      </div>
      <div className="order-3 min-[861px]:order-none w-full min-[861px]:w-[120px]">
        <Chip variant={RENEWAL_VARIANT[contract.renewal_status]}>{contract.renewal_status}</Chip>
      </div>
      <div className="hidden min-[861px]:block w-[110px] truncate text-[13.5px] text-ink-2">
        {contract.owner || "—"}
      </div>
      <div className="order-4 min-[861px]:order-none flex w-full min-[861px]:w-[170px] items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">{contract.contact_name || "—"}</span>
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
      </div>
    </div>
  );
}
