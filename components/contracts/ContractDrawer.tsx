"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, fieldControlClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useData } from "@/lib/data/DataProvider";
import { fmtDate, shiftDateOnly, waLink } from "@/lib/format";
import { light, weeksLabel } from "@/lib/contracts";
import type { Contract, RenewalStatus } from "@/types/db";

const RENEWAL_STATUSES: RenewalStatus[] = ["Not discussed", "In talks", "Renewing", "Leaving"];

type FormState = {
  brand: string;
  category: string;
  space: string;
  owner: string;
  start_date: string;
  end_date: string;
  renewal_status: RenewalStatus;
  rent: string;
  terms: string;
  contact_name: string;
  phone: string;
  notes: string;
};

const BLANK_FORM: FormState = {
  brand: "",
  category: "",
  space: "",
  owner: "Ali",
  start_date: "",
  end_date: "",
  renewal_status: "Not discussed",
  rent: "",
  terms: "",
  contact_name: "",
  phone: "",
  notes: "",
};

function toForm(initial: Partial<Contract> | null): FormState {
  if (!initial) return BLANK_FORM;
  return {
    brand: initial.brand ?? "",
    category: initial.category ?? "",
    space: initial.space ?? "",
    owner: initial.owner ?? "Ali",
    start_date: initial.start_date ?? "",
    end_date: initial.end_date ?? "",
    renewal_status: initial.renewal_status ?? "Not discussed",
    rent: initial.rent != null ? String(initial.rent) : "",
    terms: initial.terms ?? "",
    contact_name: initial.contact_name ?? "",
    phone: initial.phone ?? "",
    notes: initial.notes ?? "",
  };
}

export function ContractDrawer({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** A full Contract (edit mode, has `id`) or a partial prefill (new). */
  initial: (Partial<Contract> & { id?: string }) | null;
  onSaved?: (contract: Contract) => void;
}) {
  const { contracts, prospects, createContract, updateContract, deleteContract } = useData();
  const toast = useToast();
  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const [errors, setErrors] = useState<{ brand?: string; end_date?: string; dateOrder?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(toForm(initial));
      setErrors({});
    }
  }

  const owners = useMemo(() => {
    const set = new Set<string>(["Ali"]);
    for (const c of contracts) if (c.owner) set.add(c.owner);
    return Array.from(set).sort();
  }, [contracts]);

  const callout = useMemo(() => {
    if (!form.end_date) return null;
    if (form.renewal_status === "Renewing") {
      return { tone: "go" as const, text: "Marked Renewing. This contract won't trigger alerts." };
    }
    if (form.renewal_status === "Leaving") {
      const n = prospects.filter(
        (p) => p.space && form.space && p.space === form.space && p.join_date && p.status !== "Converted",
      ).length;
      return {
        tone: "hold" as const,
        text: `${form.space || "This space"} opens on ${fmtDate(form.end_date)}. ${n} prospect${n === 1 ? "" : "s"} have asked for this space.`,
      };
    }
    const bandInput = { end_date: form.end_date, renewal_status: form.renewal_status };
    const l = light(bandInput);
    if (l !== "go") {
      const decideBy = fmtDate(shiftDateOnly(form.end_date, -28));
      return {
        tone: l,
        text: `${weeksLabel(bandInput)}. Decide on renewal before ${decideBy} to stay out of the red.`,
      };
    }
    return null;
  }, [form.end_date, form.renewal_status, form.space, prospects]);

  const calloutClass =
    callout?.tone === "go"
      ? "border-go bg-go-bg text-go"
      : callout?.tone === "stop"
        ? "border-stop bg-stop-bg text-stop"
        : "border-hold bg-hold-bg text-hold";

  async function handleSave() {
    const errs: typeof errors = {};
    if (!form.brand.trim()) errs.brand = "Brand is required.";
    if (!form.end_date) errs.end_date = "Contract end is required.";
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      errs.dateOrder = "Start date must be before the end date.";
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast("Fix the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        brand: form.brand.trim(),
        category: form.category.trim(),
        space: form.space.trim(),
        owner: form.owner.trim(),
        start_date: form.start_date || null,
        end_date: form.end_date,
        renewal_status: form.renewal_status,
        rent: form.rent ? Number(form.rent) : 0,
        terms: form.terms,
        contact_name: form.contact_name,
        phone: form.phone,
        notes: form.notes,
      };
      let saved: Contract;
      if (isEdit && initial?.id) {
        saved = await updateContract(initial.id, payload);
        toast("Contract updated.");
      } else {
        saved = await createContract(payload);
        toast("Contract added.");
      }
      onSaved?.(saved);
      onClose();
    } catch {
      toast("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    try {
      await deleteContract(initial.id);
      toast("Contract deleted.");
      onClose();
    } catch {
      toast("Couldn't delete. Try again.");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? form.brand || "Edit contract" : "Add contract"}
      footer={
        <div className="flex items-center justify-between gap-2">
          <div>
            {isEdit ? (
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                Delete
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {form.phone ? (
              <Button variant="whatsapp" href={waLink(form.phone)} target="_blank" rel="noreferrer">
                WhatsApp
              </Button>
            ) : null}
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {callout ? (
          <div className={`rounded-sm border px-3 py-2.5 text-[13.5px] font-medium ${calloutClass}`}>
            {callout.text}
          </div>
        ) : null}

        <Field label="Brand" htmlFor="c-brand" hint={errors.brand}>
          <input
            id="c-brand"
            className={fieldControlClass}
            value={form.brand}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="c-category">
            <input
              id="c-category"
              className={fieldControlClass}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </Field>
          <Field label="Space" htmlFor="c-space">
            <input
              id="c-space"
              className={fieldControlClass}
              value={form.space}
              onChange={(e) => setForm((f) => ({ ...f, space: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Renewal decision owner" htmlFor="c-owner">
          <input
            id="c-owner"
            className={fieldControlClass}
            list="contract-owners"
            value={form.owner}
            onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
          />
          <datalist id="contract-owners">
            {owners.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Contract start" htmlFor="c-start">
            <input
              id="c-start"
              type="date"
              className={fieldControlClass}
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
          </Field>
          <Field label="Contract end" htmlFor="c-end" hint={errors.end_date ?? errors.dateOrder}>
            <input
              id="c-end"
              type="date"
              className={fieldControlClass}
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Renewal status" htmlFor="c-status">
            <select
              id="c-status"
              className={fieldControlClass}
              value={form.renewal_status}
              onChange={(e) =>
                setForm((f) => ({ ...f, renewal_status: e.target.value as RenewalStatus }))
              }
            >
              {RENEWAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monthly rent PKR" htmlFor="c-rent">
            <input
              id="c-rent"
              inputMode="numeric"
              className={fieldControlClass}
              value={form.rent}
              onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value.replace(/\D/g, "") }))}
            />
          </Field>
        </div>

        <Field label="Terms" htmlFor="c-terms">
          <input
            id="c-terms"
            className={fieldControlClass}
            value={form.terms}
            onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Primary contact" htmlFor="c-contact">
            <input
              id="c-contact"
              className={fieldControlClass}
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
            />
          </Field>
          <Field label="Phone" htmlFor="c-phone">
            <input
              id="c-phone"
              className={fieldControlClass}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Renewal notes" htmlFor="c-notes">
          <textarea
            id="c-notes"
            rows={3}
            className={fieldControlClass}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </Field>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete contract?"
        message={`This permanently deletes ${form.brand || "this contract"}. This can't be undone.`}
      />
    </Drawer>
  );
}
