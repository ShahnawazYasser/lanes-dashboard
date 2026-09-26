import { describe, expect, it } from "vitest";
import {
  buildContractRow,
  buildProspectRow,
  guessColumnMapping,
  normalizeImportDate,
  parseRent,
} from "../import";

describe("normalizeImportDate", () => {
  it("parses an Excel serial number", () => {
    // 46023 -> 2026-01-01
    expect(normalizeImportDate(46023)).toBe("2026-01-01");
  });

  it("parses DD/MM/YYYY, day first", () => {
    expect(normalizeImportDate("05/03/2026")).toBe("2026-03-05");
  });

  it("parses DD-MM-YYYY", () => {
    expect(normalizeImportDate("05-03-2026")).toBe("2026-03-05");
  });

  it("parses DD.MM.YY, expanding the 2-digit year", () => {
    expect(normalizeImportDate("05.03.26")).toBe("2026-03-05");
  });

  it("parses ISO YYYY-MM-DD", () => {
    expect(normalizeImportDate("2026-03-05")).toBe("2026-03-05");
  });

  it("returns null for blank values", () => {
    expect(normalizeImportDate("")).toBeNull();
    expect(normalizeImportDate(null)).toBeNull();
    expect(normalizeImportDate(undefined)).toBeNull();
  });

  it("returns null rather than throwing for unparseable text", () => {
    expect(normalizeImportDate("not sure yet")).toBeNull();
  });

  it("returns null for an out-of-range day/month", () => {
    expect(normalizeImportDate("40/13/2026")).toBeNull();
  });
});

describe("parseRent", () => {
  it("strips a currency prefix and thousands separators", () => {
    expect(parseRent("Rs 85,000/month")).toBe(85000);
  });

  it("handles a stray period before the number", () => {
    expect(parseRent("Rs. 85,000/month")).toBe(85000);
  });

  it("returns 0 when there is no number", () => {
    expect(parseRent("TBD")).toBe(0);
    expect(parseRent(null)).toBe(0);
  });
});

describe("guessColumnMapping", () => {
  it("maps phone-like headers for prospects", () => {
    const mapping = guessColumnMapping("prospects", ["Business Name", "Mobile Number"]);
    expect(mapping.phone).toBe("Mobile Number");
    expect(mapping.name).toBe("Business Name");
  });

  it("prefers first_contacted over contact_name for an ambiguous header", () => {
    const mapping = guessColumnMapping("prospects", ["First Contacted", "Contact Person"]);
    expect(mapping.first_contacted).toBe("First Contacted");
    expect(mapping.contact_name).toBe("Contact Person");
  });

  it("maps contract end/start dates distinctly", () => {
    const mapping = guessColumnMapping("contracts", ["Brand", "Contract Start", "Contract End"]);
    expect(mapping.start_date).toBe("Contract Start");
    expect(mapping.end_date).toBe("Contract End");
  });
});

describe("buildProspectRow", () => {
  const mapping = guessColumnMapping("prospects", [
    "Business Name",
    "Status",
    "Requested Move-in",
  ]);

  it("falls back to Not contacted for an unrecognized status", () => {
    const row = buildProspectRow({ "Business Name": "Acme", Status: "Interested" }, mapping);
    expect(row.insert.status).toBe("Not contacted");
  });

  it("keeps a recognized status", () => {
    const row = buildProspectRow({ "Business Name": "Acme", Status: "Replied" }, mapping);
    expect(row.insert.status).toBe("Replied");
  });

  it("imports an unparseable date as null and flags it as skipped", () => {
    const row = buildProspectRow(
      { "Business Name": "Acme", "Requested Move-in": "whenever" },
      mapping,
    );
    expect(row.insert.join_date).toBeNull();
    expect(row.dateSkipped).toBe(true);
  });
});

describe("buildContractRow", () => {
  const mapping = guessColumnMapping("contracts", ["Brand", "Contract End", "Rent"]);

  it("defaults a missing start date to end - 180 days", () => {
    const row = buildContractRow({ Brand: "Acme", "Contract End": "2026-12-31" }, mapping);
    expect(row.insert.start_date).toBe("2026-07-04");
  });

  it("always sets renewal_status to Not discussed", () => {
    const row = buildContractRow({ Brand: "Acme", "Contract End": "2026-12-31" }, mapping);
    expect(row.insert.renewal_status).toBe("Not discussed");
  });

  it("parses a Rs-prefixed rent column", () => {
    const row = buildContractRow(
      { Brand: "Acme", "Contract End": "2026-12-31", Rent: "Rs 85,000/month" },
      mapping,
    );
    expect(row.insert.rent).toBe(85000);
  });
});
