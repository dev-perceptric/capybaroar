"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Badge, Button, Empty, Field, Input, Page, TabNav } from "@/components/ui";
import { Select } from "@/components/Select";

type Tab = "workspace" | "members" | "billing";

const ZONES = ["America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Singapore", "Asia/Ho_Chi_Minh", "Australia/Sydney"];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("workspace");
  const [zone, setZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  return (
    <Page
      icon={<Settings />}
      title="Settings"
      tabs={
        <TabNav<Tab>
          label="Settings"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "workspace", label: "Workspace" },
            { value: "members", label: "Members" },
            { value: "billing", label: "Billing" },
          ]}
        />
      }
    >
      <div className="mx-auto w-full max-w-[640px]">
        {tab === "workspace" ? (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-[15px] font-medium">Workspace</h2>
              <p className="text-[12px] text-muted">The name and time zone of this workspace</p>
            </div>
            <Field label="Name">
              <Input defaultValue="Perceptric" />
            </Field>
            <Field label="Time zone">
              <Select value={zone} onChange={setZone} options={[...new Set([zone, ...ZONES])].map((z) => ({ value: z, label: z.replace(/_/g, " ") }))} />
            </Field>
            <div>
              <Button>Save</Button>
            </div>
          </section>
        ) : tab === "members" ? (
          <Empty compact drawing="people" title="Invite your team" action={<Button>Invite</Button>}>
            Teammates can write posts and send them for approval.
          </Empty>
        ) : (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-[15px] font-medium">Billing</h2>
              <p className="text-[12px] text-muted">Your plan and payment method</p>
            </div>
            <div className="flex items-center gap-3 border border-frame p-4">
              <span className="flex-1 text-[13px] font-medium">Free trial</span>
              <Badge tone="yellow">Trial</Badge>
              <Button>Choose a plan</Button>
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
