import { describe, expect, it } from "vitest";
import { fmtDate, fmtPKR, waLink } from "../format";

describe("fmtDate", () => {
  it("formats a Postgres date string as DD/MM/YYYY", () => {
    expect(fmtDate("2026-03-05")).toBe("05/03/2026");
  });

  it("returns an empty string for null/undefined", () => {
    expect(fmtDate(null)).toBe("");
    expect(fmtDate(undefined)).toBe("");
  });
});

describe("fmtPKR", () => {
  it("formats with the PKR prefix and thousands separators", () => {
    expect(fmtPKR(85000)).toBe("PKR 85,000");
  });

  it("rounds fractional amounts", () => {
    expect(fmtPKR(1500.6)).toBe("PKR 1,501");
  });
});

describe("waLink", () => {
  it("converts a local 03XXXXXXXXX number to the 92 prefix", () => {
    expect(waLink("03211234567")).toBe("https://wa.me/923211234567");
  });

  it("strips separators before converting", () => {
    expect(waLink("0321-123-4567")).toBe("https://wa.me/923211234567");
  });

  it("leaves an already-international number as-is", () => {
    expect(waLink("923211234567")).toBe("https://wa.me/923211234567");
  });
});
