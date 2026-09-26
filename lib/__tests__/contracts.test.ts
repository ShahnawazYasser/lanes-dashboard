import { describe, expect, it } from "vitest";
import { light, needsDecision, weeksLeft } from "../contracts";
import { todayKarachi } from "../format";
import type { Contract } from "@/types/db";

function endDateDaysFromToday(days: number): string {
  const d = new Date(todayKarachi());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeContract(days: number, renewal_status: Contract["renewal_status"] = "Not discussed") {
  return { end_date: endDateDaysFromToday(days), renewal_status };
}

describe("weeksLeft", () => {
  it("returns 8 for a contract ending exactly 56 days out", () => {
    expect(weeksLeft(makeContract(56))).toBe(8);
  });

  it("returns 4 for a contract ending exactly 28 days out", () => {
    expect(weeksLeft(makeContract(28))).toBe(4);
  });

  it("is negative for an already-ended contract", () => {
    expect(weeksLeft(makeContract(-7))).toBeLessThan(0);
  });
});

describe("light", () => {
  it("is green at exactly 8 weeks", () => {
    expect(light(makeContract(56))).toBe("go");
  });

  it("is amber one day short of 8 weeks", () => {
    expect(light(makeContract(55))).toBe("hold");
  });

  it("is amber at exactly 4 weeks", () => {
    expect(light(makeContract(28))).toBe("hold");
  });

  it("is red one day short of 4 weeks", () => {
    expect(light(makeContract(27))).toBe("stop");
  });

  it("is red for an already-ended contract", () => {
    expect(light(makeContract(-3))).toBe("stop");
  });

  it("is green far in the future", () => {
    expect(light(makeContract(365))).toBe("go");
  });
});

describe("needsDecision", () => {
  it("is false for a green contract", () => {
    expect(needsDecision(makeContract(365))).toBe(false);
  });

  it("is true for an amber contract", () => {
    expect(needsDecision(makeContract(28))).toBe(true);
  });

  it("is true for a red contract", () => {
    expect(needsDecision(makeContract(-3))).toBe(true);
  });

  it("is false for a Renewing contract even when red", () => {
    expect(needsDecision(makeContract(-3, "Renewing"))).toBe(false);
  });

  it("is true for a Leaving contract that is red", () => {
    expect(needsDecision(makeContract(-3, "Leaving"))).toBe(true);
  });
});
