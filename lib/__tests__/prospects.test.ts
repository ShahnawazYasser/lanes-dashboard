import { describe, expect, it } from "vitest";
import { daysSince, lastContact } from "../prospects";
import { todayKarachi } from "../format";

function isoDaysAgo(days: number): string {
  const d = new Date(todayKarachi());
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

describe("lastContact", () => {
  it("falls back to first_contacted when there are no comments", () => {
    const dateStr = isoDaysAgo(10).slice(0, 10);
    const result = lastContact({ first_contacted: dateStr }, []);
    expect(result.toISOString().slice(0, 10)).toBe(dateStr);
  });

  it("prefers the newest comment over an older first_contacted", () => {
    const first = isoDaysAgo(30).slice(0, 10);
    const commentDate = isoDaysAgo(2);
    const result = lastContact({ first_contacted: first }, [{ created_at: commentDate }]);
    expect(result.toISOString().slice(0, 10)).toBe(commentDate.slice(0, 10));
  });

  it("picks the newest of several comments", () => {
    const result = lastContact({ first_contacted: null }, [
      { created_at: isoDaysAgo(20) },
      { created_at: isoDaysAgo(5) },
      { created_at: isoDaysAgo(45) },
    ]);
    expect(result.toISOString().slice(0, 10)).toBe(isoDaysAgo(5).slice(0, 10));
  });
});

describe("daysSince", () => {
  it("is 0 for contact today", () => {
    expect(daysSince({ first_contacted: isoDaysAgo(0).slice(0, 10) })).toBe(0);
  });

  it("matches the day count for a past contact", () => {
    expect(daysSince({ first_contacted: isoDaysAgo(14).slice(0, 10) })).toBe(14);
  });

  it("is never negative", () => {
    expect(daysSince({ first_contacted: null }, [])).toBe(0);
  });
});
