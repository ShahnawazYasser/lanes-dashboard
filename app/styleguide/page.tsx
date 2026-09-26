"use client";

import { useState } from "react";
import { Lamp, type LampVariant } from "@/components/ui/Lamp";
import { Chip, type ChipVariant } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Field, fieldControlClass } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";

const LAMP_VARIANTS: LampVariant[] = ["go", "hold", "stop", "off"];
const CHIP_VARIANTS: ChipVariant[] = ["neutral", "go", "hold", "stop", "quiet"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[16px] font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function PrimitivesShowcase() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const showToast = useToast();

  return (
    <div className="flex flex-col gap-8">
      <Section title="Lamp">
        <div className="flex items-center gap-6">
          {LAMP_VARIANTS.map((v) => (
            <div key={v} className="flex items-center gap-2">
              <Lamp variant={v} />
              <span className="text-[13px] text-ink-2">{v}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          {CHIP_VARIANTS.map((v) => (
            <Chip key={v} variant={v}>
              {v}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default">Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="whatsapp" href="https://wa.me/923000000000">
            WhatsApp
          </Button>
          <Button variant="default" size="sm">
            Small
          </Button>
        </div>
      </Section>

      <Section title="Panel">
        <Panel className="p-4">
          <p className="text-[13px] text-ink-2">A surface with a line border and shadow.</p>
        </Panel>
      </Section>

      <Section title="Field">
        <div className="grid max-w-sm gap-3">
          <Field label="Brand" htmlFor="sg-brand">
            <input id="sg-brand" className={fieldControlClass} placeholder="e.g. Noor Loom" />
          </Field>
          <Field label="Category" htmlFor="sg-category" hint="Used to group spaces.">
            <select id="sg-category" className={fieldControlClass}>
              <option>Womenswear</option>
              <option>Menswear</option>
            </select>
          </Field>
          <Field label="Notes" htmlFor="sg-notes">
            <textarea id="sg-notes" className={fieldControlClass} rows={3} />
          </Field>
        </div>
      </Section>

      <Section title="Drawer / Modal / Toast">
        <div className="flex flex-wrap gap-2">
          <Button variant="default" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
          <Button variant="default" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="default" onClick={() => showToast("Saved.")}>
            Show toast
          </Button>
        </div>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Example drawer">
          <p className="text-[13px] text-ink-2">Closes on Escape or a click on the scrim.</p>
        </Drawer>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal">
          <p className="text-[13px] text-ink-2">Centred, same close behaviour as the drawer.</p>
        </Modal>
      </Section>

      <Section title="EmptyState">
        <Panel>
          <EmptyState title="Nothing here yet" hint="One instructive sentence goes here." />
        </Panel>
      </Section>
    </div>
  );
}

function ThemeScope({ theme, children }: { theme: "light" | "dark"; children: React.ReactNode }) {
  return (
    <div data-theme={theme} className="flex-1 rounded-lg bg-bg p-6 text-ink">
      <p className="mb-6 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{theme}</p>
      {children}
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <div className="flex flex-col gap-6 py-2 min-[1024px]:flex-row min-[1024px]:items-start">
      <ThemeScope theme="light">
        <PrimitivesShowcase />
      </ThemeScope>
      <ThemeScope theme="dark">
        <PrimitivesShowcase />
      </ThemeScope>
    </div>
  );
}
