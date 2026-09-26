import type { Prospect, ProspectComment } from "@/types/db";
import { karachiDateOnly, parseDateOnly, todayKarachi } from "./format";

type ProspectLike = Pick<Prospect, "first_contacted">;
type CommentLike = Pick<ProspectComment, "created_at">;

/**
 * Latest of `first_contacted` and the newest comment's `created_at`, as a
 * Karachi-calendar-day (UTC-midnight) Date. Falls back to today if neither is set.
 */
export function lastContact(prospect: ProspectLike, comments: CommentLike[] = []): Date {
  const candidates: Date[] = [];
  if (prospect.first_contacted) candidates.push(parseDateOnly(prospect.first_contacted));
  for (const comment of comments) {
    candidates.push(karachiDateOnly(new Date(comment.created_at)));
  }
  if (candidates.length === 0) return todayKarachi();
  return candidates.reduce((latest, d) => (d > latest ? d : latest));
}

/** Whole days since `lastContact`, computed in Asia/Karachi. Never negative. */
export function daysSince(prospect: ProspectLike, comments: CommentLike[] = []): number {
  const last = lastContact(prospect, comments);
  const today = todayKarachi();
  const days = Math.round((today.getTime() - last.getTime()) / 86_400_000);
  return Math.max(0, days);
}
