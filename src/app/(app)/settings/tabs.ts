// Settings tabs: which ones a person sees and which one an address opens. Pure, so the page (which reads only the
// open tab's data) and SettingsView (in the browser) agree. Covered by tests/settingsTabs.test.ts.

export type SettingsTab = "general" | "brands" | "members" | "queue" | "audit" | "api" | "billing" | "account";

export type TabGroup = { label: string; tabs: { id: SettingsTab; label: string }[] };

/** The nav: members who don't run the workspace (`manager` false) see only Your account. */
export function settingsGroups(manager: boolean): TabGroup[] {
  const account: TabGroup = { label: "Account", tabs: [{ id: "account", label: "Your account" }] };
  if (!manager) return [account];
  return [
    {
      label: "Workspace",
      tabs: [
        { id: "general", label: "General" },
        { id: "brands", label: "Brands" },
        { id: "members", label: "Members" },
        { id: "queue", label: "Queue" },
        { id: "audit", label: "Audit log" },
      ],
    },
    { label: "Plan", tabs: [{ id: "billing", label: "Billing" }] },
    { label: "Developers", tabs: [{ id: "api", label: "API and MCP" }] },
    account,
  ];
}

/** The tab named by `?tab=` (or an older link's `#brands`) when this person can see it, else null. */
export function knownTab(raw: string | string[] | null | undefined, manager: boolean): SettingsTab | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return (
    settingsGroups(manager)
      .flatMap((g) => g.tabs)
      .find((t) => t.id === v)?.id ?? null
  );
}

/** The tab an address opens: the one it names, else the first one this person sees. */
export function openTab(raw: string | string[] | null | undefined, manager: boolean): SettingsTab {
  return knownTab(raw, manager) ?? settingsGroups(manager)[0].tabs[0].id;
}
