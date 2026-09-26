"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, fieldControlClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useData, type ProspectWithComments } from "@/lib/data/DataProvider";
import { light } from "@/lib/contracts";
import { knownSpaces } from "@/lib/spaces";
import { fmtDate, fmtDateTime, waLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Contract, Prospect, ProspectStatus } from "@/types/db";

const TAG_OPTIONS = ["Shown interest", "Given comments"];
const STATUSES: ProspectStatus[] = ["Not contacted", "No reply", "Replied", "Converted"];

type FormState = {
  name: string;
  category: string;
  contact_name: string;
  phone: string;
  status: ProspectStatus;
  first_contacted: string;
  join_date: string;
  space: string;
  tags: string[];
};

const BLANK_FORM: FormState = {
  name: "",
  category: "",
  contact_name: "",
  phone: "",
  status: "Not contacted",
  first_contacted: "",
  join_date: "",
  space: "",
  tags: [],
};

function toForm(initial: Partial<Prospect> | null): FormState {
  if (!initial) return BLANK_FORM;
  return {
    name: initial.name ?? "",
    category: initial.category ?? "",
    contact_name: initial.contact_name ?? "",
    phone: initial.phone ?? "",
    status: initial.status ?? "Not contacted",
    first_contacted: initial.first_contacted ?? "",
    join_date: initial.join_date ?? "",
    space: initial.space ?? "",
    tags: initial.tags ?? [],
  };
}

export function ProspectDrawer({
  open,
  onClose,
  initial,
  onConvert,
}: {
  open: boolean;
  onClose: () => void;
  /** A full prospect w/ comments (edit) or null (new). */
  initial: ProspectWithComments | null;
  /** Called after conversion, with a contract prefill for the caller to open in ContractDrawer. */
  onConvert: (prefill: Partial<Contract>) => void;
}) {
  const { contracts, prospects, createProspect, updateProspect, deleteProspect, addComment } = useData();
  const toast = useToast();
  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const [firstComment, setFirstComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [saving, setSaving] = useState(false);
  const [loggingComment, setLoggingComment] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(toForm(initial));
      setFirstComment("");
      setNewComment("");
      setErrors({});
    }
  }

  // `initial` is a snapshot from when the drawer opened; re-derive the live
  // record from context so the comment log reflects comments just logged.
  const live = initial ? (prospects.find((p) => p.id === initial.id) ?? initial) : null;

  const spaces = useMemo(() => knownSpaces(contracts, prospects), [contracts, prospects]);

  const spaceCallout = useMemo(() => {
    if (!form.space) return null;
    const holder = contracts.find((c) => c.space === form.space);
    if (!holder) return { tone: "off" as const, text: `${form.space} is currently empty.` };
    const l = light(holder);
    return {
      tone: l,
      text: `${form.space} is held by ${holder.brand} until ${fmtDate(holder.end_date)} (${holder.renewal_status}).`,
    };
  }, [form.space, contracts]);

  const calloutClass =
    spaceCallout?.tone === "go"
      ? "border-go bg-go-bg text-go"
      : spaceCallout?.tone === "stop"
        ? "border-stop bg-stop-bg text-stop"
        : spaceCallout?.tone === "hold"
          ? "border-hold bg-hold-bg text-hold"
          : "border-line bg-surface-2 text-ink-2";

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  async function handleLogComment() {
    if (!initial?.id || !newComment.trim()) return;
    setLoggingComment(true);
    try {
      await addComment(initial.id, newComment.trim());
      if (live?.status === "Not contacted") {
        await updateProspect(initial.id, { status: "No reply" });
      }
      setNewComment("");
      toast("Comment logged.");
    } catch {
      toast("Couldn't log comment. Try again.");
    } finally {
      setLoggingComment(false);
    }
  }

  async function handleSave() {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "Business name is required.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast("Fix the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        contact_name: form.contact_name,
        phone: form.phone,
        status: form.status,
        first_contacted: form.first_contacted || null,
        join_date: form.join_date || null,
        space: form.space.trim(),
        tags: form.tags,
      };
      if (isEdit && initial?.id) {
        await updateProspect(initial.id, payload);
        toast("Prospect updated.");
      } else {
        await createProspect(payload, firstComment);
        toast("Prospect added.");
      }
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
      await deleteProspect(initial.id);
      toast("Prospect deleted.");
      onClose();
    } catch {
      toast("Couldn't delete. Try again.");
    }
  }

  async function handleConvert() {
    if (!initial?.id) return;
    try {
      await updateProspect(initial.id, { status: "Converted" });
      await addComment(initial.id, "Converted to contract.");
      const lastComment = live?.prospect_comments[0]?.body ?? "";
      const start = form.join_date || new Date().toISOString().slice(0, 10);
      const end = new Date(`${start}T00:00:00Z`);
      end.setUTCDate(end.getUTCDate() + 180);
      onClose();
      onConvert({
        brand: form.name,
        category: form.category,
        space: form.space,
        start_date: start,
        end_date: end.toISOString().slice(0, 10),
        contact_name: form.contact_name,
        phone: form.phone,
        owner: "Ali",
        renewal_status: "Not discussed",
        notes: lastComment,
      });
      toast("Prefilled from prospect. Check the dates and rent.");
    } catch {
      toast("Couldn't convert. Try again.");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? form.name || "Edit prospect" : "Add prospect"}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isEdit ? (
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                Delete
              </Button>
            ) : null}
            {isEdit && form.status !== "Converted" ? (
              <Button variant="default" onClick={handleConvert}>
                Convert to contract
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
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
        {spaceCallout ? (
          <div className={cn("rounded-sm border px-3 py-2.5 text-[13.5px] font-medium", calloutClass)}>
            {spaceCallout.text}
          </div>
        ) : null}

        {isEdit ? (
          <div className="flex flex-col gap-3 rounded-sm border border-line p-3">
            <Field label="Log a comment" htmlFor="p-comment">
              <textarea
                id="p-comment"
                rows={2}
                className={fieldControlClass}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
            </Field>
            <div>
              <Button
                variant="default"
                size="sm"
                onClick={handleLogComment}
                disabled={loggingComment || !newComment.trim()}
              >
                Log comment
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {(live?.prospect_comments ?? []).length === 0 ? (
                <p className="text-[13px] text-ink-3">No comments yet.</p>
              ) : (
                [...(live?.prospect_comments ?? [])]
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((c) => (
                    <div key={c.id} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
                      <div className="text-[12px] text-ink-3">{fmtDateTime(c.created_at)}</div>
                      <div className="text-[13.5px] text-ink">{c.body}</div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : (
          <Field label="First comment" htmlFor="p-first-comment">
            <textarea
              id="p-first-comment"
              rows={3}
              className={fieldControlClass}
              value={firstComment}
              onChange={(e) => setFirstComment(e.target.value)}
            />
          </Field>
        )}

        <Field label="Business name" htmlFor="p-name" hint={errors.name}>
          <input
            id="p-name"
            className={fieldControlClass}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>

        <Field label="Category" htmlFor="p-category">
          <input
            id="p-category"
            className={fieldControlClass}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact name" htmlFor="p-contact">
            <input
              id="p-contact"
              className={fieldControlClass}
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
            />
          </Field>
          <Field label="Phone" htmlFor="p-phone">
            <input
              id="p-phone"
              className={fieldControlClass}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Status" htmlFor="p-status">
          <select
            id="p-status"
            className={fieldControlClass}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProspectStatus }))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First contacted" htmlFor="p-first-contacted">
            <input
              id="p-first-contacted"
              type="date"
              className={fieldControlClass}
              value={form.first_contacted}
              onChange={(e) => setForm((f) => ({ ...f, first_contacted: e.target.value }))}
            />
          </Field>
          <Field label="Requested join date" htmlFor="p-join-date">
            <input
              id="p-join-date"
              type="date"
              className={fieldControlClass}
              value={form.join_date}
              onChange={(e) => setForm((f) => ({ ...f, join_date: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Requested space" htmlFor="p-space">
          <input
            id="p-space"
            className={fieldControlClass}
            list="prospect-spaces"
            value={form.space}
            onChange={(e) => setForm((f) => ({ ...f, space: e.target.value }))}
          />
          <datalist id="prospect-spaces">
            {spaces.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>

        <Field label="Tags" htmlFor="p-tags">
          <div id="p-tags" className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => {
              const active = form.tags.includes(tag);
              return (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}>
                  <Chip variant={active ? "go" : "neutral"}>{tag}</Chip>
                </button>
              );
            })}
          </div>
        </Field>

        {form.phone ? (
          <Button variant="whatsapp" href={waLink(form.phone)} target="_blank" rel="noreferrer">
            WhatsApp
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete prospect?"
        message={`This permanently deletes ${form.name || "this prospect"}. This can't be undone.`}
      />
    </Drawer>
  );
}
