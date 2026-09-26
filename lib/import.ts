import Papa from "papaparse";
import * as XLSX from "xlsx";
import { shiftDateOnly } from "./format";
import type { Contract, Prospect, ProspectStatus } from "@/types/db";

export type ImportTarget = "prospects" | "contracts";

export type RowValue = string | number | null | undefined;
export type ImportRow = Record<string, RowValue>;

export type FieldDef<K extends string = string> = {
  key: K;
  label: string;
  required?: boolean;
  keywords: string[];
};

export type ProspectFieldKey =
  | "name"
  | "category"
  | "contact_name"
  | "phone"
  | "status"
  | "join_date"
  | "space"
  | "first_contacted"
  | "comment";

export type ContractFieldKey =
  | "brand"
  | "category"
  | "space"
  | "end_date"
  | "start_date"
  | "rent"
  | "contact_name"
  | "phone"
  | "owner"
  | "notes";

export const PROSPECT_FIELDS: FieldDef<ProspectFieldKey>[] = [
  { key: "name", label: "Business name", required: true, keywords: ["business name", "business", "name", "brand"] },
  { key: "category", label: "Category", keywords: ["category", "type"] },
  { key: "contact_name", label: "Contact name", keywords: ["contact"] },
  { key: "phone", label: "Phone", keywords: ["phone", "mobile", "whatsapp", "cell"] },
  { key: "status", label: "Status", keywords: ["status"] },
  { key: "join_date", label: "Requested join date", keywords: ["join", "move in", "movein"] },
  { key: "space", label: "Requested space", keywords: ["space", "unit", "shop"] },
  { key: "first_contacted", label: "First contacted", keywords: ["first contact", "contacted"] },
  { key: "comment", label: "Comment", keywords: ["comment", "note", "remark"] },
];

// Determines which field claims an ambiguous header first (e.g. "First Contacted"
// contains "contact", so first_contacted must be matched before contact_name).
const PROSPECT_GUESS_ORDER: ProspectFieldKey[] = [
  "first_contacted",
  "join_date",
  "comment",
  "status",
  "phone",
  "space",
  "contact_name",
  "name",
  "category",
];

export const CONTRACT_FIELDS: FieldDef<ContractFieldKey>[] = [
  { key: "brand", label: "Brand", required: true, keywords: ["brand", "business", "name"] },
  { key: "category", label: "Category", keywords: ["category", "type"] },
  { key: "space", label: "Space", keywords: ["space", "unit", "shop"] },
  { key: "end_date", label: "Contract end", required: true, keywords: ["end", "expiry", "expire"] },
  { key: "start_date", label: "Contract start", keywords: ["start"] },
  { key: "rent", label: "Rent", keywords: ["rent", "amount"] },
  { key: "contact_name", label: "Contact name", keywords: ["contact"] },
  { key: "phone", label: "Phone", keywords: ["phone", "mobile", "whatsapp", "cell"] },
  { key: "owner", label: "Owner", keywords: ["owner"] },
  { key: "notes", label: "Notes", keywords: ["notes", "note", "remark"] },
];

const CONTRACT_GUESS_ORDER: ContractFieldKey[] = [
  "end_date",
  "start_date",
  "rent",
  "owner",
  "notes",
  "phone",
  "space",
  "contact_name",
  "brand",
  "category",
];

export function fieldsFor(target: ImportTarget): FieldDef[] {
  return target === "prospects" ? PROSPECT_FIELDS : CONTRACT_FIELDS;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[_-]+/g, " ").trim();
}

/** Maps each target field to the best-guess file column, by fuzzy header keyword match. */
export function guessColumnMapping(target: ImportTarget, headers: string[]): Record<string, string | null> {
  const fields = fieldsFor(target);
  const order = target === "prospects" ? PROSPECT_GUESS_ORDER : CONTRACT_GUESS_ORDER;
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const used = new Set<string>();
  const result: Record<string, string | null> = {};
  for (const key of order) {
    const field = byKey.get(key);
    if (!field) continue;
    let found: string | null = null;
    for (const header of headers) {
      if (used.has(header)) continue;
      const norm = normalizeHeader(header);
      if (field.keywords.some((kw) => norm.includes(kw))) {
        found = header;
        break;
      }
    }
    if (found) used.add(found);
    result[key] = found;
  }
  return result;
}

/**
 * Normalizes a raw cell value to a Postgres date string ("YYYY-MM-DD").
 * Handles Excel serial numbers, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YY and ISO
 * YYYY-MM-DD. Blank or unparseable values return null rather than throwing.
 */
export function normalizeImportDate(raw: RowValue): string | null {
  if (raw == null) return null;

  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null;
    const d = new Date(Math.round((raw - 25569) * 86400000));
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const str = raw.trim();
  if (!str) return null;

  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, mo, d] = iso;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const dayFirst = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (dayFirst) {
    const day = Number(dayFirst[1]);
    const month = Number(dayFirst[2]);
    let year = Number(dayFirst[3]);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  if (/^\d+(\.\d+)?$/.test(str)) {
    return normalizeImportDate(Number(str));
  }

  return null;
}

/** Extracts the first plausible number from a rent string, e.g. "Rs 85,000/month" -> 85000. */
export function parseRent(raw: RowValue): number {
  if (raw == null) return 0;
  const str = String(raw);
  const match = str.match(/\d[\d,]*(\.\d+)?/);
  if (!match) return 0;
  const n = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function cell(row: ImportRow, mapping: Record<string, string | null>, field: string): RowValue {
  const header = mapping[field];
  return header ? row[header] : undefined;
}

function str(value: RowValue): string {
  return value == null ? "" : String(value).trim();
}

function isBlank(value: RowValue): boolean {
  return value == null || String(value).trim() === "";
}

const PROSPECT_STATUSES: ProspectStatus[] = ["Not contacted", "No reply", "Replied", "Converted"];

export type BuiltProspectRow = {
  insert: Partial<Prospect> & Pick<Prospect, "name">;
  comment: string | null;
  dateSkipped: boolean;
};

/** Builds a prospect insert payload (plus optional first comment) from one mapped file row. */
export function buildProspectRow(row: ImportRow, mapping: Record<string, string | null>): BuiltProspectRow {
  const rawJoin = cell(row, mapping, "join_date");
  const rawFirst = cell(row, mapping, "first_contacted");
  const joinDate = normalizeImportDate(rawJoin);
  const firstContacted = normalizeImportDate(rawFirst);
  const dateSkipped =
    (!isBlank(rawJoin) && joinDate === null) || (!isBlank(rawFirst) && firstContacted === null);

  const rawStatus = str(cell(row, mapping, "status"));
  const status = (PROSPECT_STATUSES as string[]).includes(rawStatus)
    ? (rawStatus as ProspectStatus)
    : "Not contacted";

  return {
    insert: {
      name: str(cell(row, mapping, "name")),
      category: str(cell(row, mapping, "category")),
      contact_name: str(cell(row, mapping, "contact_name")),
      phone: str(cell(row, mapping, "phone")),
      status,
      join_date: joinDate,
      space: str(cell(row, mapping, "space")),
      first_contacted: firstContacted,
    },
    comment: str(cell(row, mapping, "comment")) || null,
    dateSkipped,
  };
}

export type BuiltContractRow = {
  insert: Partial<Contract> & Pick<Contract, "brand" | "end_date">;
  dateSkipped: boolean;
};

/** Builds a contract insert payload from one mapped file row. Missing start date defaults to end - 180d. */
export function buildContractRow(row: ImportRow, mapping: Record<string, string | null>): BuiltContractRow {
  const rawEnd = cell(row, mapping, "end_date");
  const rawStart = cell(row, mapping, "start_date");
  const endDate = normalizeImportDate(rawEnd);
  let startDate = normalizeImportDate(rawStart);
  const dateSkipped =
    (!isBlank(rawEnd) && endDate === null) || (!isBlank(rawStart) && startDate === null);

  if (!startDate && endDate) {
    startDate = shiftDateOnly(endDate, -180);
  }

  return {
    insert: {
      brand: str(cell(row, mapping, "brand")),
      category: str(cell(row, mapping, "category")),
      space: str(cell(row, mapping, "space")),
      end_date: endDate ?? "",
      start_date: startDate,
      rent: parseRent(cell(row, mapping, "rent")),
      contact_name: str(cell(row, mapping, "contact_name")),
      phone: str(cell(row, mapping, "phone")),
      owner: str(cell(row, mapping, "owner")),
      renewal_status: "Not discussed",
      notes: str(cell(row, mapping, "notes")),
    },
    dateSkipped,
  };
}

function dropBlankRows(rows: ImportRow[], headers: string[]): ImportRow[] {
  return rows.filter((row) => headers.some((h) => !isBlank(row[h])));
}

export type ParsedFile = { headers: string[]; rows: ImportRow[] };

function parseCsvFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<ImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        resolve({ headers, rows: dropBlankRows(results.data, headers) });
      },
      error: (error: Error) => reject(error),
    });
  });
}

async function parseExcelFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows: dropBlankRows(rows, headers) };
}

/** Parses an uploaded .csv, .xls or .xlsx file into headers + row objects. */
export function parseImportFile(file: File): Promise<ParsedFile> {
  if (file.name.toLowerCase().endsWith(".csv")) return parseCsvFile(file);
  return parseExcelFile(file);
}

/** Four fake rows so the import flow can be demoed without a real file. */
export function sampleImportRows(): ParsedFile {
  return {
    headers: [
      "Business Name",
      "Category",
      "Contact Person",
      "WhatsApp",
      "Status",
      "Requested Move-in",
      "Space",
      "First Contacted",
      "Comments",
    ],
    rows: [
      {
        "Business Name": "Karak Chai Co.",
        Category: "Food & beverage",
        "Contact Person": "Bilal Ahmed",
        WhatsApp: "0321-1234567",
        Status: "Replied",
        "Requested Move-in": "15/11/2026",
        Space: "R2",
        "First Contacted": "01/09/2026",
        Comments: "Wants a corner unit, asked about foot traffic.",
      },
      {
        "Business Name": "Threadwork Studio",
        Category: "Apparel",
        "Contact Person": "Sana Malik",
        WhatsApp: "0333-9988776",
        Status: "No reply",
        "Requested Move-in": "01.12.2026",
        Space: "F5",
        "First Contacted": "12-08-2026",
        Comments: "",
      },
      {
        "Business Name": "Pixel Print Lab",
        Category: "Printing",
        "Contact Person": "Owais Raza",
        WhatsApp: "0300-1112223",
        Status: "",
        "Requested Move-in": "",
        Space: "",
        "First Contacted": "2026-09-10",
        Comments: "Comparing us against another mall.",
      },
      {
        "Business Name": "Nimko House",
        Category: "Food & beverage",
        "Contact Person": "Farah Iqbal",
        WhatsApp: "0345-5556667",
        Status: "Converted",
        "Requested Move-in": "not sure yet",
        Space: "G1",
        "First Contacted": "20/07/26",
        Comments: "Ready to sign, chasing paperwork.",
      },
    ],
  };
}
