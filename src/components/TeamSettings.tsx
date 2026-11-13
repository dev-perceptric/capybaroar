"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, MoreHorizontal, Palette, Pencil, Plus, Trash2, Unlink, UserPlus, Users } from "lucide-react";
import { Avatar, Badge, Button, Checkbox, CopyButton, Dot, Field, IconButton, Input, PaneHead, Switch, TextArea } from "./ui";
import { Modal } from "./Overlay";
import { FloatingHere, HoverTip } from "./Floating";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { askConfirm, askText, tell } from "./Dialogs";
import type { Brand } from "@/lib/brands";
import type { Invite, Member } from "@/lib/team";
import type { Role } from "@/lib/session";
import { fmtDate, fmtNum } from "@/lib/format";
import {
  addBrand,
  invite,
  newReviewLink,
  removeBrand,
  removeMemberFrom,
  removeReviewLink,
  saveApproval,
  saveBrandLimit,
  saveBrandName,
  saveMemberBrands,
  saveMemberRole,
  withdrawInvite,
  loadBrandKit,
  saveBrandKitFor,
} from "@/app/(app)/settings/actions";

/** A brand row in Settings. creditsUsed and creditLimit are set when the plan has brand credit limits. */
export type TeamBrand = Brand & { channels: number; reviewLink: string | null; creditsUsed?: number; creditLimit?: number | null };

export type TeamInfo = {
  me: string;
  mail: boolean;
  brands: TeamBrand[];
  /** The plan has a credit limit for each brand: the Brands table shows Credits used and Credit limit. */
  creditLimits?: boolean;
  members: Member[];
  invites: Invite[];
};

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "client", label: "Client" },
];
const roleName = (r: Role) => (r === "owner" ? "Owner" : (ROLES.find((x) => x.value === r)?.label ?? r));

/** Runs a settings action, shows its error, then refreshes the page. */
function useRun() {
  const router = useRouter();
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>, failTitle: string) =>
    start(async () => {
      const r = await fn();
      if (r.error) await tell(failTitle, r.error);
      router.refresh();
    });
  return { run, busy };
}

const CARD = "rounded-lg bg-panel shadow-card";
const HEAD = "border-b border-line text-left text-[12px] text-muted";
const TH = "h-10 px-4 font-medium whitespace-nowrap";
const TR = "border-b border-line last:border-b-0 hover:bg-hover";
const TD = "px-4 py-2.5";
const ITEM = "flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left hover:bg-hover disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-3.5 [&_svg]:text-muted";

/** A row's "..." button and its menu, on the floating layer. */
function RowMenu({ label, children }: { label: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <span className="relative inline-flex">
      <IconButton label={label} align="end" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <MoreHorizontal />
      </IconButton>
      {open ? (
        <FloatingHere placement="bottom-end" onClose={close} role="menu" className="min-w-48 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu">
          {children(close)}
        </FloatingHere>
      ) : null}
    </span>
  );
}

export function BrandsSection({ team }: { team: TeamInfo }) {
  const { run, busy } = useRun();
  const [kitFor, setKitFor] = useState<Brand | null>(null);
  const add = async () => {
    const name = await askText("New brand", { placeholder: "Brand name", ok: "Add" });
    if (name) run(() => addBrand(name), "Couldn't add the brand");
  };
  const rename = async (b: Brand) => {
    const name = await askText("Rename brand", { initial: b.name });
    if (name && name !== b.name) run(() => saveBrandName(b.id, name), "Couldn't rename the brand");
  };
  const del = async (b: Brand) => {
    if (await askConfirm(`Delete ${b.name}?`, { ok: "Delete", danger: true })) run(() => removeBrand(b.id), "Couldn't delete the brand");
  };
  const revoke = async (b: Brand) => {
    if (await askConfirm(`Turn off the review link for ${b.name}?`, { body: "The link stops working.", ok: "Turn off", danger: true })) run(() => removeReviewLink(b.id), "Couldn't turn off the link");
  };
  const credits = !!team.creditLimits;
  return (
    <>
      <PaneHead title="Brands" line="Each brand has its own channels, posts and approvals">
        <Button variant="ghost" size="sm" disabled={busy} onClick={add}>
          <Plus /> Add a brand
        </Button>
      </PaneHead>
      <div className={`overflow-x-auto ${CARD}`}>
        <table className={`w-full text-[13px] ${credits ? "min-w-[760px]" : "min-w-[600px]"}`}>
          <thead>
            <tr className={HEAD}>
              <th className={TH}>Brand</th>
              <th className={`${TH} text-right`}>Channels</th>
              <th className={TH}>Posts need approval</th>
              {credits ? <th className={`${TH} text-right`}>Credits used</th> : null}
              {credits ? <th className={TH}>Credit limit</th> : null}
              <th className={TH}>Review link</th>
              <th className={TH}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {team.brands.map((b) => (
              <tr key={b.id} className={TR}>
                <td className={TD}>
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <Dot tone={b.color} />
                    <span className="min-w-0 wrap-break-word">{b.name}</span>
                  </span>
                </td>
                <td className={`${TD} text-right tabular-nums`}>{fmtNum(b.channels)}</td>
                <td className={TD}>
                  <Switch on={b.needs_approval} label={`Posts for ${b.name} need approval`} disabled={busy} onChange={(on) => run(() => saveApproval(b.id, on), "Couldn't save")} />
                </td>
                {credits ? <td className={`${TD} text-right tabular-nums`}>{fmtNum(b.creditsUsed ?? 0)}</td> : null}
                {credits ? (
                  <td className={TD}>
                    <LimitInput brand={b} />
                  </td>
                ) : null}
                <td className={TD}>{b.reviewLink ? <CopyButton text={b.reviewLink} label="Copy review link" /> : null}</td>
                <td className={`${TD} w-12 text-right`}>
                  <RowMenu label={`More for ${b.name}`}>
                    {(close) => (
                      <>
                        {b.reviewLink ? (
                          <button type="button" role="menuitem" className={ITEM} disabled={busy} onClick={() => (close(), void revoke(b))}>
                            <Unlink /> Turn off review link
                          </button>
                        ) : (
                          <button type="button" role="menuitem" className={ITEM} disabled={busy} onClick={() => (close(), run(() => newReviewLink(b.id), "Couldn't make the link"))}>
                            <Link2 /> Make a review link
                          </button>
                        )}
                        <button type="button" role="menuitem" className={ITEM} onClick={() => (close(), setKitFor(b))}>
                          <Palette /> Brand kit
                        </button>
                        <button type="button" role="menuitem" className={ITEM} disabled={busy} onClick={() => (close(), void rename(b))}>
                          <Pencil /> Rename
                        </button>
                        <button type="button" role="menuitem" className={`${ITEM} text-danger hover:bg-danger-soft [&_svg]:text-danger`} disabled={busy || team.brands.length < 2} onClick={() => (close(), void del(b))}>
                          <Trash2 /> Delete
                        </button>
                      </>
                    )}
                  </RowMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {kitFor ? <BrandKitModal brand={kitFor} onClose={() => setKitFor(null)} /> : null}
    </>
  );
}

/** A brand's monthly credit limit (Agency): saved when the box loses focus or on Enter. Empty means no limit. */
function LimitInput({ brand }: { brand: TeamBrand }) {
  const router = useRouter();
  const limit = brand.creditLimit ?? null;
  const [value, setValue] = useState(limit == null ? "" : String(limit));
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const t = value.trim();
    const next = t === "" ? null : Number(t);
    if (next === limit) return;
    if (next != null && (!Number.isInteger(next) || next < 0)) {
      await tell("Enter a whole number of credits");
      return;
    }
    setSaving(true);
    const r = await saveBrandLimit(brand.id, next);
    setSaving(false);
    if (r.error) await tell(r.error);
    else router.refresh();
  };
  return (
    <span className="flex items-center gap-2">
      <Input aria-label={`Credit limit for ${brand.name}`} inputMode="numeric" placeholder="No limit" className="w-28" value={value} onChange={(e) => setValue(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />
      {saving ? <Loader /> : null}
    </span>
  );
}

/** A brand's voice, words to avoid and hashtags: every AI that writes for the brand follows them. */
function BrandKitModal({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  const [kit, setKit] = useState<{ voice: string; avoid: string; hashtags: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  useEffect(() => {
    loadBrandKit(brand.id).then(
      (k) => setKit({ voice: k.voice, avoid: k.avoid.join(", "), hashtags: k.hashtags.join(" ") }),
      () => setKit({ voice: "", avoid: "", hashtags: "" }),
    );
  }, [brand.id]);
  const save = () =>
    kit &&
    start(async () => {
      const r = await saveBrandKitFor(brand.id, { ...kit, hashtags: kit.hashtags.replace(/\s+/g, ",") });
      if (r.error) setError(r.error);
      else onClose();
    });
  return (
    <Modal
      title={`${brand.name} brand kit`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!kit || busy} onClick={save}>
            {busy ? <Loader /> : null}
            Save
          </Button>
        </>
      }
    >
      {kit ? (
        <div className="flex flex-col gap-4">
          <Field label="Voice">
            <TextArea rows={4} value={kit.voice} maxLength={1500} placeholder="Warm and plain. Short sentences. We say we, never I." onChange={(e) => setKit({ ...kit, voice: e.target.value })} />
          </Field>
          <Field label="Words to avoid">
            <Input value={kit.avoid} placeholder="cheap, guys, synergy" onChange={(e) => setKit({ ...kit, avoid: e.target.value })} />
          </Field>
          <Field label="Hashtags to add">
            <Input value={kit.hashtags} placeholder="#crumbandco #sourdough" onChange={(e) => setKit({ ...kit, hashtags: e.target.value })} />
          </Field>
          {error ? <p className="text-[12.5px] text-danger">{error}</p> : null}
        </div>
      ) : (
        <Loader />
      )}
    </Modal>
  );
}

export function MembersSection({ team }: { team: TeamInfo }) {
  const { run, busy } = useRun();
  const [inviting, setInviting] = useState(false);
  const [access, setAccess] = useState<Member | null>(null);
  const remove = async (m: Member) => {
    if (await askConfirm(`Remove ${m.name}?`, { body: `${m.email} loses access to this workspace.`, ok: "Remove", danger: true })) run(() => removeMemberFrom(m.userId), "Couldn't remove");
  };
  const withdraw = async (i: Invite) => {
    if (await askConfirm(`Withdraw the invite for ${i.email}?`, { ok: "Withdraw", danger: true })) run(() => withdrawInvite(i.id), "Couldn't withdraw");
  };
  const many = team.brands.length > 1;
  /** "All brands", the one brand's name, or "N brands" with the names on hover. */
  const brandsCell = (role: Role, ids: string[] | null) => {
    if (role === "owner" || role === "admin" || ids === null) return <span className="text-muted">All brands</span>;
    const names = team.brands.filter((b) => ids.includes(b.id)).map((b) => b.name);
    if (!names.length) return <span className="text-muted">No brands</span>;
    if (names.length === 1) return <span className="wrap-break-word">{names[0]}</span>;
    return (
      <span tabIndex={0} className="cursor-default rounded-xs outline-none focus-visible:shadow-focus">
        {names.length} brands
        <HoverTip text={names.join(", ")} wrap />
      </span>
    );
  };
  return (
    <>
      <PaneHead title="Members" line="Who can open this workspace">
        <Button size="sm" onClick={() => setInviting(true)}>
          <UserPlus /> Invite
        </Button>
      </PaneHead>
      <div className={`overflow-x-auto ${CARD}`}>
        <table className="w-full min-w-[680px] text-[13px]">
          <thead>
            <tr className={HEAD}>
              <th className={TH}>Name</th>
              <th className={TH}>Email</th>
              <th className={TH}>Role</th>
              {many ? <th className={TH}>Brands</th> : null}
              <th className={TH}>Status</th>
              <th className={TH}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {team.members.map((m) => {
              const fixed = m.role === "owner" || m.userId === team.me;
              const scoped = many && (m.role === "editor" || m.role === "client");
              return (
                <tr key={m.userId} className={TR}>
                  <td className={TD}>
                    <span className="flex items-center gap-2 font-medium">
                      <Avatar label={m.name} size={24} />
                      <span className="min-w-0 wrap-break-word">
                        {m.name}
                        {m.userId === team.me ? <span className="font-normal text-faint"> (you)</span> : null}
                      </span>
                    </span>
                  </td>
                  <td className={`${TD} wrap-anywhere text-muted`}>{m.email}</td>
                  <td className={TD}>{fixed ? <Badge>{roleName(m.role)}</Badge> : <Select size="sm" ariaLabel={`Role for ${m.name}`} className="w-32" value={m.role} disabled={busy} onChange={(v) => run(() => saveMemberRole(m.userId, v), "Couldn't change the role")} options={ROLES} />}</td>
                  {many ? <td className={TD}>{brandsCell(m.role, m.brandIds)}</td> : null}
                  <td className={TD} />
                  <td className={`${TD} text-right`}>
                    <span className="inline-flex items-center justify-end gap-1">
                      {scoped ? (
                        <IconButton label="Brands" disabled={busy} onClick={() => setAccess(m)}>
                          <Users />
                        </IconButton>
                      ) : null}
                      {!fixed ? (
                        <IconButton label="Remove" align="end" disabled={busy} onClick={() => remove(m)}>
                          <Trash2 />
                        </IconButton>
                      ) : null}
                    </span>
                  </td>
                </tr>
              );
            })}
            {team.invites.map((i) => (
              <tr key={i.id} className={TR}>
                <td className={TD}>
                  <span className="flex items-center gap-2 text-muted">
                    <Avatar label={i.email} size={24} />
                  </span>
                </td>
                <td className={`${TD} wrap-anywhere`}>{i.email}</td>
                <td className={TD}>
                  <Badge>{roleName(i.role)}</Badge>
                </td>
                {many ? <td className={TD}>{brandsCell(i.role, i.brandIds)}</td> : null}
                <td className={TD}>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge tone="yellow">Invited</Badge>
                    {i.expiresAt ? <span className="text-[12px] whitespace-nowrap text-muted">Until {fmtDate(i.expiresAt)}</span> : null}
                  </span>
                </td>
                <td className={`${TD} text-right`}>
                  <span className="inline-flex items-center justify-end gap-1">
                    {i.link ? <CopyButton text={i.link} label="Copy invite link" /> : null}
                    <IconButton label="Withdraw invite" align="end" disabled={busy} onClick={() => withdraw(i)}>
                      <Trash2 />
                    </IconButton>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {inviting ? <InviteDialog team={team} onClose={() => setInviting(false)} /> : null}
      {access ? <AccessDialog team={team} member={access} onClose={() => setAccess(null)} /> : null}
    </>
  );
}

/** Pick brands: every brand, or some. null means all. */
function BrandPicks({ brands, value, onChange }: { brands: Brand[]; value: string[] | null; onChange: (v: string[] | null) => void }) {
  const on = (id: string) => value === null || value.includes(id);
  return (
    <div className="flex flex-col rounded-lg bg-paper p-1 shadow-track">
      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-[13px] font-medium hover:bg-hover">
        <Checkbox checked={value === null} onChange={(v) => onChange(v ? null : [])} />
        All brands
      </label>
      {brands.map((b) => (
        <label key={b.id} className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-[13px] hover:bg-hover">
          <Checkbox
            checked={on(b.id)}
            onChange={(v) => {
              const cur = value ?? brands.map((x) => x.id);
              const next = v ? [...new Set([...cur, b.id])] : cur.filter((x) => x !== b.id);
              onChange(next.length === brands.length ? null : next);
            }}
          />
          <Dot tone={b.color} />
          <span className="truncate">{b.name}</span>
        </label>
      ))}
    </div>
  );
}

function InviteDialog({ team, onClose }: { team: TeamInfo; onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [brands, setBrands] = useState<string[] | null>(team.brands.length > 1 ? [] : null);
  const [error, setError] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const send = () =>
    start(async () => {
      setError("");
      const r = await invite(email, role, role === "admin" ? null : brands);
      if (r.error) return setError(r.error);
      router.refresh();
      if (r.emailed) onClose();
      else setLink(r.link ?? null);
    });
  if (link)
    return (
      <Modal
        title={`Invite link for ${email.trim()}`}
        onClose={onClose}
        footer={
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        }
      >
        <div className="flex items-center gap-1.5">
          <Input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Invite link" />
          <CopyButton text={link} label="Copy invite link" />
        </div>
      </Modal>
    );
  return (
    <Modal
      title="Invite to this workspace"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="plain" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form" disabled={busy || !email.trim() || (role !== "admin" && brands !== null && !brands.length)}>
            {busy ? <Loader /> : null}
            Invite
          </Button>
        </>
      }
    >
      <form
        id="invite-form"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Field label="Email">
          <Input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
        </Field>
        <Field label="Role">
          <Select ariaLabel="Role" value={role} onChange={setRole} options={ROLES} />
        </Field>
        {role !== "admin" && team.brands.length > 1 ? (
          <Field label="Brands">
            <BrandPicks brands={team.brands} value={brands} onChange={setBrands} />
          </Field>
        ) : null}
        {error ? <p className="text-[12px] text-danger">{error}</p> : null}
      </form>
    </Modal>
  );
}

function AccessDialog({ team, member, onClose }: { team: TeamInfo; member: Member; onClose: () => void }) {
  const router = useRouter();
  const [brands, setBrands] = useState<string[] | null>(member.brandIds);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const save = () =>
    start(async () => {
      const r = await saveMemberBrands(member.userId, brands);
      if (r.error) return setError(r.error);
      router.refresh();
      onClose();
    });
  return (
    <Modal
      title={`Brands for ${member.name}`}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="plain" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || (brands !== null && !brands.length)} onClick={save}>
            {busy ? <Loader /> : null}
            Save
          </Button>
        </>
      }
    >
      <BrandPicks brands={team.brands} value={brands} onChange={setBrands} />
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
    </Modal>
  );
}
