"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClass } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useData } from "@/lib/data/DataProvider";
import {
  buildContractRow,
  buildProspectRow,
  fieldsFor,
  guessColumnMapping,
  parseImportFile,
  sampleImportRows,
  type ImportRow,
  type ImportTarget,
} from "@/lib/import";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type Step = "upload" | "target" | "mapping" | "preview";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "target", label: "Target" },
  { key: "mapping", label: "Columns" },
  { key: "preview", label: "Preview" },
];

const ACCEPT = ".xlsx,.xls,.csv";

export function ImportView() {
  const router = useRouter();
  const toast = useToast();
  const { createProspectsBatch, createContractsBatch } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [target, setTarget] = useState<ImportTarget>("prospects");
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [importing, setImporting] = useState(false);

  const fields = useMemo(() => fieldsFor(target), [target]);

  const missingRequired = useMemo(
    () => fields.filter((f) => f.required && !mapping[f.key]).map((f) => f.label),
    [fields, mapping],
  );

  async function loadFile(file: File) {
    setLoadError(null);
    try {
      const parsed = await parseImportFile(file);
      if (parsed.rows.length === 0) {
        setLoadError("That file has no rows to import.");
        return;
      }
      setFileName(file.name);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setStep("target");
    } catch {
      setLoadError("Couldn't read that file. Try exporting it again as .xlsx or .csv.");
    }
  }

  function loadSample() {
    const sample = sampleImportRows();
    setLoadError(null);
    setFileName("Sample sheet");
    setHeaders(sample.headers);
    setRows(sample.rows);
    setStep("target");
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  }

  function confirmTarget() {
    setMapping(guessColumnMapping(target, headers));
    setStep("mapping");
  }

  function setFieldMapping(fieldKey: string, header: string) {
    setMapping((m) => ({ ...m, [fieldKey]: header || null }));
  }

  const previewRows = useMemo(() => {
    return rows.slice(0, 5).map((row) =>
      target === "prospects" ? buildProspectRow(row, mapping) : buildContractRow(row, mapping),
    );
  }, [rows, mapping, target]);

  const importableCount = useMemo(() => {
    if (target === "prospects") {
      return rows.filter((row) => buildProspectRow(row, mapping).insert.name).length;
    }
    return rows.filter((row) => {
      const built = buildContractRow(row, mapping);
      return built.insert.brand && built.insert.end_date;
    }).length;
  }, [rows, mapping, target]);

  async function handleImport() {
    setImporting(true);
    try {
      if (target === "prospects") {
        const built = rows.map((row) => buildProspectRow(row, mapping));
        const importable = built.filter((b) => b.insert.name);
        const skipped = importable.filter((b) => b.dateSkipped).length;
        await createProspectsBatch(
          importable.map((b) => b.insert),
          importable.map((b) => b.comment),
        );
        toast(
          `Imported ${importable.length} prospects.${skipped > 0 ? ` ${skipped} date${skipped === 1 ? "" : "s"} skipped.` : ""}`,
        );
        router.push("/prospects");
      } else {
        const built = rows.map((row) => buildContractRow(row, mapping));
        const importable = built.filter((b) => b.insert.brand && b.insert.end_date);
        const skipped = importable.filter((b) => b.dateSkipped).length;
        await createContractsBatch(importable.map((b) => b.insert));
        toast(
          `Imported ${importable.length} contracts.${skipped > 0 ? ` ${skipped} date${skipped === 1 ? "" : "s"} skipped.` : ""}`,
        );
        router.push("/contracts");
      }
    } catch {
      toast("Couldn't import. Try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = s.key === step;
          const done = STEPS.findIndex((x) => x.key === step) > i;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                  active
                    ? "bg-brand text-brand-ink"
                    : done
                      ? "bg-surface-2 text-ink-2"
                      : "border border-line text-ink-3",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("text-[13px]", active ? "font-semibold text-ink" : "text-ink-3")}>
                {s.label}
              </span>
              {i < STEPS.length - 1 ? <span className="h-px w-6 bg-line" /> : null}
            </div>
          );
        })}
      </div>

      {step === "upload" ? (
        <Panel className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center",
              dragging ? "border-brand bg-surface-2" : "border-line",
            )}
          >
            <p className="text-[16px] font-bold text-ink">Drop a spreadsheet here</p>
            <p className="max-w-sm text-[13px] text-ink-2">
              .xlsx, .xls or .csv — Ali&apos;s prospect or contract list, exported as-is.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void loadFile(file);
                e.target.value = "";
              }}
            />
            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
              Choose a file
            </Button>
            {loadError ? <p className="text-[13px] font-medium text-stop">{loadError}</p> : null}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="default" onClick={loadSample}>
              Try with a sample sheet
            </Button>
          </div>
        </Panel>
      ) : null}

      {step === "target" ? (
        <Panel className="p-6">
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-ink-2">
              {fileName} · {rows.length} row{rows.length === 1 ? "" : "s"}
            </p>
            <Field label="These rows are" htmlFor="import-target">
              <select
                id="import-target"
                className={fieldControlClass}
                value={target}
                onChange={(e) => setTarget(e.target.value as ImportTarget)}
              >
                <option value="prospects">Prospects</option>
                <option value="contracts">Contracts</option>
              </select>
            </Field>
            <div className="flex justify-between">
              <Button variant="default" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button variant="primary" onClick={confirmTarget}>
                Next
              </Button>
            </div>
          </div>
        </Panel>
      ) : null}

      {step === "mapping" ? (
        <Panel className="p-6">
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-ink-2">Match each field to a column from your file.</p>
            <div className="grid gap-3 min-[560px]:grid-cols-2">
              {fields.map((field) => (
                <Field
                  key={field.key}
                  label={field.required ? `${field.label} (required)` : field.label}
                  htmlFor={`map-${field.key}`}
                >
                  <select
                    id={`map-${field.key}`}
                    className={fieldControlClass}
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => setFieldMapping(field.key, e.target.value)}
                  >
                    <option value="">Don&apos;t import</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="default" onClick={() => setStep("target")}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep("preview")}>
                Next
              </Button>
            </div>
          </div>
        </Panel>
      ) : null}

      {step === "preview" ? (
        <Panel className="p-6">
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-ink-2">
              First {previewRows.length} of {rows.length} row{rows.length === 1 ? "" : "s"}, as they&apos;ll be
              saved.
            </p>
            <div className="overflow-x-auto rounded-sm border border-line">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="bg-surface-2 text-ink-2">
                  <tr>
                    {fields.map((f) => (
                      <th key={f.key} className="whitespace-nowrap px-3 py-2 font-medium">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      {fields.map((f) => (
                        <td key={f.key} className="whitespace-nowrap px-3 py-2 text-ink">
                          {f.key === "comment"
                            ? ("comment" in r ? (r.comment ?? "") : "")
                            : formatPreviewCell(r.insert as Record<string, unknown>, f.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {missingRequired.length > 0 ? (
              <p className="text-[13px] font-medium text-stop">
                Still need: {missingRequired.join(", ")}.
              </p>
            ) : null}

            <div className="flex justify-between">
              <Button variant="default" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importing || missingRequired.length > 0}
              >
                {importing ? "Importing…" : `Import ${importableCount} ${target}`}
              </Button>
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function formatPreviewCell(insert: Record<string, unknown>, key: string): string {
  const value = insert[key];
  if (key === "join_date" || key === "first_contacted" || key === "start_date" || key === "end_date") {
    return typeof value === "string" ? fmtDate(value) : "";
  }
  if (key === "comment") return typeof value === "string" ? value : "";
  if (value == null) return "";
  return String(value);
}
