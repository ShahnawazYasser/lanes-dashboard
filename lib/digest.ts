import type { Contract, Prospect, ProspectComment } from "@/types/db";
import { light, needsDecision, weeksLabel } from "./contracts";
import { daysSince } from "./prospects";
import { fmtDate, parseDateOnly, todayKarachi } from "./format";

export type ProspectWithComments = Prospect & { prospect_comments: ProspectComment[] };

export type ContractRow = {
  brand: string;
  space: string;
  weeksLabel: string;
  endDate: string;
  renewalStatus: Contract["renewal_status"];
  owner: string;
};

export type JoiningRow = {
  name: string;
  requestedDate: string;
  requestedSpace: string;
};

export type QuietRow = {
  name: string;
  phone: string;
  daysSince: number;
};

export type DigestData = {
  red: ContractRow[];
  amber: ContractRow[];
  joining: JoiningRow[];
  quiet: QuietRow[];
};

/**
 * A contract needs a spot on the digest/bell when it's red or amber (and not
 * Renewing), or when it's been marked Leaving at all — even a Leaving
 * contract that's still green should stay visible. Bucketed by light() below
 * (green-but-Leaving lands in amber) so the bell count always equals
 * red.length + amber.length, keeping badge/modal/email in lockstep.
 */
function isAlertable(contract: Contract): boolean {
  return needsDecision(contract) || contract.renewal_status === "Leaving";
}

export function alertingContracts(contracts: Contract[]): Contract[] {
  return contracts.filter(isAlertable);
}

/** Bell badge count: see isAlertable for exactly what counts. */
export function alertCount(contracts: Contract[]): number {
  return alertingContracts(contracts).length;
}

function toContractRow(contract: Contract): ContractRow {
  return {
    brand: contract.brand,
    space: contract.space,
    weeksLabel: weeksLabel(contract),
    endDate: fmtDate(contract.end_date),
    renewalStatus: contract.renewal_status,
    owner: contract.owner,
  };
}

function daysUntil(dateStr: string): number {
  const target = parseDateOnly(dateStr);
  const today = todayKarachi();
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function buildDigest(contracts: Contract[], prospects: ProspectWithComments[]): DigestData {
  const alerting = alertingContracts(contracts);
  const red = alerting.filter((c) => light(c) === "stop").map(toContractRow);
  const amber = alerting.filter((c) => light(c) !== "stop").map(toContractRow);

  const joining = prospects
    .filter((p): p is ProspectWithComments & { join_date: string } => p.status !== "Converted" && !!p.join_date)
    .map((p) => ({ p, days: daysUntil(p.join_date) }))
    .filter(({ days }) => days >= 0 && days <= 30)
    .sort((a, b) => a.days - b.days)
    .map(
      ({ p }): JoiningRow => ({
        name: p.name,
        requestedDate: fmtDate(p.join_date),
        requestedSpace: p.space,
      }),
    );

  const quiet = prospects
    .filter((p) => p.status !== "Converted")
    .map((p) => ({ p, days: daysSince(p, p.prospect_comments) }))
    .filter(({ days }) => days >= 21)
    .sort((a, b) => b.days - a.days)
    .slice(0, 5)
    .map(({ p, days }): QuietRow => ({ name: p.name, phone: p.phone, daysSince: days }));

  return { red, amber, joining, quiet };
}

export function digestSubject(data: DigestData, dateLabel: string): string {
  return `Lanes: ${data.red.length} red, ${data.amber.length} amber, ${dateLabel}`;
}

/** Today's date in Asia/Karachi, formatted DD/MM/YYYY. */
export function todayLabel(): string {
  return fmtDate(todayKarachi().toISOString().slice(0, 10));
}
