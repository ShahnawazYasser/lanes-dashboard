import type { Contract } from "@/types/db";
import { parseDateOnly, todayKarachi } from "./format";

export type Light = "go" | "hold" | "stop";

type ContractLike = Pick<Contract, "end_date">;
type DecisionLike = Pick<Contract, "end_date" | "renewal_status">;

function diffDays(end: Date, start: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Weeks between today (Asia/Karachi) and the contract's end date. Negative if already ended. */
export function weeksLeft(contract: ContractLike): number {
  const end = parseDateOnly(contract.end_date);
  const today = todayKarachi();
  return diffDays(end, today) / 7;
}

/** Traffic light band: green (8+ weeks), amber (4 up to 8), red (under 4, including ended). */
export function light(contract: ContractLike): Light {
  const w = weeksLeft(contract);
  if (w >= 8) return "go";
  if (w >= 4) return "hold";
  return "stop";
}

/** Human-readable label, e.g. "6 weeks left", "3 days left", "Ended 2 weeks ago". */
export function weeksLabel(contract: ContractLike): string {
  const end = parseDateOnly(contract.end_date);
  const today = todayKarachi();
  const days = diffDays(end, today);

  if (days < 0) {
    const daysAgo = Math.abs(days);
    const weeksAgo = Math.floor(daysAgo / 7);
    if (weeksAgo >= 1) return `Ended ${weeksAgo} week${weeksAgo === 1 ? "" : "s"} ago`;
    return `Ended ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
  }
  if (days === 0) return "Ends today";
  const weeks = Math.floor(days / 7);
  if (weeks >= 1) return `${weeks} week${weeks === 1 ? "" : "s"} left`;
  return `${days} day${days === 1 ? "" : "s"} left`;
}

/**
 * True when this contract needs a renewal decision: inside the amber/red
 * window and not already marked `Renewing` (which is excluded from alerts).
 */
export function needsDecision(contract: DecisionLike): boolean {
  if (contract.renewal_status === "Renewing") return false;
  return light(contract) !== "go";
}
