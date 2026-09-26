"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipVariant } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { fieldControlClass } from "@/components/ui/Field";
import { ProspectDrawer } from "./ProspectDrawer";
import { ContractDrawer } from "@/components/contracts/ContractDrawer";
import { useData, type ProspectWithComments } from "@/lib/data/DataProvider";
import { daysSince } from "@/lib/prospects";
import { fmtDate, waLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Contract, ProspectStatus } from "@/types/db";

const STATUS_VARIANT: Record<ProspectStatus, ChipVariant> = {
  Replied: "go",
  "No reply": "hold",
  Converted: "quiet",
  "Not contacted": "neutral",
};

type SortMode = "contact" | "join" | "name" | "category";
type PillFilter = "all" | "interest" | "comments" | "joindate" | "space";

const PILLS: { value: PillFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "interest", label: "Shown interest" },
  { value: "comments", label: "Given comments" },
  { value: "joindate", label: "Has join date" },
  { value: "space", label: "Asked for a space" },
];

export function ProspectsView() {
  const { prospects } = useData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "all" | ProspectStatus>("open");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("contact");
  const [pillFilter, setPillFilter] = useState<PillFilter>("all");

  const [prospectDrawer, setProspectDrawer] = useState<{
    open: boolean;
    initial: ProspectWithComments | null;
  }>({ open: false, initial: null });
  const [contractDrawer, setContractDrawer] = useState<{
    open: boolean;
    initial: Partial<Contract> | null;
  }>({ open: false, initial: null });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of prospects) if (p.category) set.add(p.category);
    return Array.from(set).sort();
  }, [prospects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prospects.filter((p) => {
      if (statusFilter === "open" && p.status === "Converted") return false;
      if (statusFilter !== "open" && statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (pillFilter === "interest" && !p.tags.includes("Shown interest")) return false;
      if (pillFilter === "comments" && !p.tags.includes("Given comments")) return false;
      if (pillFilter === "joindate" && !p.join_date) return false;
      if (pillFilter === "space" && !p.space) return false;
      if (q) {
        const haystack = [p.name, p.category, p.contact_name, ...p.prospect_comments.map((c) => c.body)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [prospects, search, statusFilter, categoryFilter, pillFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortMode === "join") {
      copy.sort((a, b) => {
        if (!a.join_date && !b.join_date) return 0;
        if (!a.join_date) return 1;
        if (!b.join_date) return -1;
        return a.join_date.localeCompare(b.join_date);
      });
    } else if (sortMode === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      copy.sort((a, b) => daysSince(b, b.prospect_comments) - daysSince(a, a.prospect_comments));
    }
    return copy;
  }, [filtered, sortMode]);

  const groups = useMemo(() => {
    if (sortMode !== "category") return null;
    const map = new Map<string, ProspectWithComments[]>();
    for (const p of sorted) {
      const key = p.category || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sorted, sortMode]);

  function openProspect(p: ProspectWithComments) {
    setProspectDrawer({ open: true, initial: p });
  }

  const cardGrid = "grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-3";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className={cn(fieldControlClass, "w-full min-[540px]:w-auto min-[540px]:flex-1")}
            placeholder="Search name, category, contact, comments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={cn(fieldControlClass, "w-auto")}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="open">Open (not converted)</option>
            <option value="all">All statuses</option>
            <option value="Not contacted">Not contacted</option>
            <option value="No reply">No reply</option>
            <option value="Replied">Replied</option>
            <option value="Converted">Converted</option>
          </select>
          <select
            className={cn(fieldControlClass, "w-auto")}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            className={cn(fieldControlClass, "w-auto")}
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="contact">Longest since contact</option>
            <option value="join">Soonest join date</option>
            <option value="name">Name</option>
            <option value="category">Grouped by category</option>
          </select>
          <div className="ml-auto">
            <Button
              variant="primary"
              onClick={() => setProspectDrawer({ open: true, initial: null })}
            >
              Add prospect
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setPillFilter(pill.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-[13px] font-medium",
                pillFilter === pill.value
                  ? "border-brand bg-brand text-brand-ink"
                  : "border-line text-ink-2 hover:bg-surface-2",
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </Panel>

      {sorted.length === 0 ? (
        <Panel>
          <EmptyState title="No prospects match" hint="Try clearing a filter or search." />
        </Panel>
      ) : groups ? (
        <div className="flex flex-col gap-5">
          {groups.map(([category, rows]) => (
            <div key={category} className="flex flex-col gap-2.5">
              <h3 className="text-[13px] font-semibold text-ink-2">
                {category} — {rows.length}
              </h3>
              <div className={cardGrid}>
                {rows.map((p) => (
                  <ProspectCard key={p.id} prospect={p} onOpen={() => openProspect(p)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cardGrid}>
          {sorted.map((p) => (
            <ProspectCard key={p.id} prospect={p} onOpen={() => openProspect(p)} />
          ))}
        </div>
      )}

      <ProspectDrawer
        open={prospectDrawer.open}
        initial={prospectDrawer.initial}
        onClose={() => setProspectDrawer({ open: false, initial: null })}
        onConvert={(prefill) => setContractDrawer({ open: true, initial: prefill })}
      />
      <ContractDrawer
        open={contractDrawer.open}
        initial={contractDrawer.initial}
        onClose={() => setContractDrawer({ open: false, initial: null })}
      />
    </div>
  );
}

function ProspectCard({
  prospect,
  onOpen,
}: {
  prospect: ProspectWithComments;
  onOpen: () => void;
}) {
  const days = daysSince(prospect, prospect.prospect_comments);
  const latestComment = [...prospect.prospect_comments].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];

  return (
    <Panel
      onClick={onOpen}
      className="flex cursor-pointer flex-col gap-2.5 p-4 hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">{prospect.name}</div>
          <div className="truncate text-[12.5px] text-ink-3">{prospect.category || "—"}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[22px] font-bold leading-none text-ink">{days}</div>
          <div className="text-[11px] text-ink-3">days since contact</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip variant={STATUS_VARIANT[prospect.status]}>{prospect.status}</Chip>
        {prospect.tags.map((tag) => (
          <Chip key={tag} variant="neutral">
            {tag}
          </Chip>
        ))}
      </div>

      <p className="line-clamp-2 min-h-[2.6em] text-[13px] text-ink-2">
        {latestComment ? latestComment.body : "No comments yet."}
      </p>

      <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <div className="min-w-0 text-[12.5px] text-ink-3">
          {prospect.join_date ? (
            <span>
              {fmtDate(prospect.join_date)}
              {prospect.space ? ` · ${prospect.space}` : ""}
            </span>
          ) : prospect.space ? (
            <span>{prospect.space}</span>
          ) : (
            "—"
          )}
        </div>
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
      </div>
    </Panel>
  );
}
