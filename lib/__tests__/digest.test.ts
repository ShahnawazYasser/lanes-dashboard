import { describe, expect, it } from "vitest";
import { alertCount, buildDigest, digestSubject, type ProspectWithComments } from "../digest";
import { renderDigestEmailHtml } from "../digestEmail";
import { todayKarachi } from "../format";
import type { Contract, Prospect } from "@/types/db";

function dateOffset(days: number): string {
  const d = new Date(todayKarachi());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: "c1",
    brand: "Brand",
    category: "",
    space: "R1",
    start_date: null,
    end_date: dateOffset(365),
    rent: 0,
    terms: "",
    contact_name: "",
    phone: "",
    owner: "Ali",
    renewal_status: "Not discussed",
    notes: "",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function makeProspect(overrides: Partial<Prospect> = {}): ProspectWithComments {
  return {
    id: "p1",
    name: "Prospect",
    category: "",
    contact_name: "",
    phone: "0321 0000000",
    tags: [],
    status: "Not contacted",
    first_contacted: dateOffset(0),
    join_date: null,
    space: "",
    created_at: "",
    updated_at: "",
    prospect_comments: [],
    ...overrides,
  };
}

describe("alertCount / buildDigest contracts", () => {
  it("counts a red contract and buckets it as red", () => {
    const contracts = [makeContract({ end_date: dateOffset(-3) })];
    expect(alertCount(contracts)).toBe(1);
    const data = buildDigest(contracts, []);
    expect(data.red).toHaveLength(1);
    expect(data.amber).toHaveLength(0);
  });

  it("counts an amber contract and buckets it as amber", () => {
    const contracts = [makeContract({ end_date: dateOffset(28) })];
    expect(alertCount(contracts)).toBe(1);
    const data = buildDigest(contracts, []);
    expect(data.amber).toHaveLength(1);
    expect(data.red).toHaveLength(0);
  });

  it("excludes a Renewing contract even when red", () => {
    const contracts = [makeContract({ end_date: dateOffset(-3), renewal_status: "Renewing" })];
    expect(alertCount(contracts)).toBe(0);
    const data = buildDigest(contracts, []);
    expect(data.red).toHaveLength(0);
  });

  it("excludes a green contract with no renewal decision", () => {
    const contracts = [makeContract({ end_date: dateOffset(365) })];
    expect(alertCount(contracts)).toBe(0);
  });

  it("counts a green Leaving contract, bucketed as amber", () => {
    const contracts = [makeContract({ end_date: dateOffset(365), renewal_status: "Leaving" })];
    expect(alertCount(contracts)).toBe(1);
    const data = buildDigest(contracts, []);
    expect(data.amber).toHaveLength(1);
    expect(data.red).toHaveLength(0);
  });

  it("bell count always equals red.length + amber.length", () => {
    const contracts = [
      makeContract({ id: "1", end_date: dateOffset(-3) }),
      makeContract({ id: "2", end_date: dateOffset(28) }),
      makeContract({ id: "3", end_date: dateOffset(365), renewal_status: "Leaving" }),
      makeContract({ id: "4", end_date: dateOffset(-3), renewal_status: "Renewing" }),
    ];
    const data = buildDigest(contracts, []);
    expect(alertCount(contracts)).toBe(data.red.length + data.amber.length);
    expect(alertCount(contracts)).toBe(3);
  });
});

describe("buildDigest prospects", () => {
  it("includes a prospect joining within 30 days", () => {
    const prospects = [makeProspect({ join_date: dateOffset(10) })];
    const data = buildDigest([], prospects);
    expect(data.joining).toHaveLength(1);
  });

  it("excludes a prospect joining more than 30 days out", () => {
    const prospects = [makeProspect({ join_date: dateOffset(45) })];
    expect(buildDigest([], prospects).joining).toHaveLength(0);
  });

  it("excludes a Converted prospect from joining even with a near join_date", () => {
    const prospects = [makeProspect({ join_date: dateOffset(5), status: "Converted" })];
    expect(buildDigest([], prospects).joining).toHaveLength(0);
  });

  it("flags a prospect quiet for 21+ days", () => {
    const prospects = [makeProspect({ first_contacted: dateOffset(-25) })];
    const data = buildDigest([], prospects);
    expect(data.quiet).toHaveLength(1);
    expect(data.quiet[0].daysSince).toBe(25);
  });

  it("excludes a prospect contacted recently", () => {
    const prospects = [makeProspect({ first_contacted: dateOffset(-5) })];
    expect(buildDigest([], prospects).quiet).toHaveLength(0);
  });

  it("caps gone-quiet at the top 5 by days since contact", () => {
    const prospects = Array.from({ length: 8 }, (_, i) =>
      makeProspect({ id: `p${i}`, first_contacted: dateOffset(-(21 + i)) }),
    );
    const data = buildDigest([], prospects);
    expect(data.quiet).toHaveLength(5);
    expect(data.quiet[0].daysSince).toBe(28);
    expect(data.quiet[4].daysSince).toBe(24);
  });
});

describe("digestSubject", () => {
  it("reports red and amber counts and the date", () => {
    const data = buildDigest(
      [makeContract({ end_date: dateOffset(-3) }), makeContract({ id: "2", end_date: dateOffset(28) })],
      [],
    );
    expect(digestSubject(data, "26/09/2026")).toBe("Lanes: 1 red, 1 amber, 26/09/2026");
  });
});

describe("renderDigestEmailHtml", () => {
  it("shows the fallback line when every section is empty", () => {
    const html = renderDigestEmailHtml({ red: [], amber: [], joining: [], quiet: [] }, "26/09/2026");
    expect(html).toContain("Nothing needs attention today.");
  });

  it("omits empty sections but includes populated ones", () => {
    const data = buildDigest([makeContract({ end_date: dateOffset(-3) })], []);
    const html = renderDigestEmailHtml(data, "26/09/2026");
    expect(html).toContain("Red");
    expect(html).not.toContain("Amber");
    expect(html).not.toContain("Prospects wanting to join");
    expect(html).not.toContain("Gone quiet");
  });
});
