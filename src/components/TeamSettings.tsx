"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Pencil, Plus, Trash2, Unlink, UserPlus, Users } from "lucide-react";
import { Avatar, Badge, Button, Checkbox, CopyButton, Dot, Field, IconButton, Input, Switch } from "./ui";
import { Modal } from "./Overlay";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { askConfirm, askText, tell } from "./Dialogs";
import type { Brand } from "@/lib/brands";
import type { Invite, Member } from "@/lib/team";
import type { Role } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import {
  addBrand,
  invite,
  newReviewLink,
  removeBrand,
  removeMemberFrom,
  removeReviewLink,
  saveApproval,
  saveBrandName,
  saveMemberBrands,
  saveMemberRole,
  withdrawInvite,
} from "@/app/(app)/settings/actions";

export type TeamInfo = {
  me: string;
  mail: boolean;
  brands: (Brand & { channels: number; reviewLink: string | null })[];
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

export function BrandsSection({ team }: { team: TeamInfo }) {
  const { run, busy } = useRun();
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
  return (
    <section id="brands" className="mt-10 flex scroll-mt-6 flex-col gap-4 border-t border-line pt-8">
      <div>
        <h2 className="text-[15px] font-medium">Brands</h2>
        <p className="text-[12px] text-muted">Each brand has its own channels, posts and approvals</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-frame">
        {team.brands.map((b) => (
          <div key={b.id} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2 last:border-b-0">
            <Dot tone={b.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{b.name}</p>
              <p className="text-[11px] text-faint">
                {b.channels} {b.channels === 1 ? "channel" : "channels"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-muted">
              <Switch on={b.needs_approval} label="Posts need approval" disabled={busy} onChange={(on) => run(() => saveApproval(b.id, on), "Couldn't save")} />
              Posts need approval
            </label>
            {b.reviewLink ? (
              <span className="flex items-center">
                <CopyButton text={b.reviewLink} label="Copy review link" />
                <IconButton label="Turn off review link" disabled={busy} onClick={() => revoke(b)}>
                  <Unlink size={16} />
                </IconButton>
              </span>
            ) : (
              <IconButton
                label="Make a review link"
                disabled={busy}
                onClick={() =>
                  run(() => newReviewLink(b.id), "Couldn't make the link")
                }
              >
                <Link2 size={16} />
              </IconButton>
            )}
            <IconButton label="Rename" disabled={busy} onClick={() => rename(b)}>
              <Pencil size={16} />
            </IconButton>
            <IconButton label="Delete" disabled={busy || team.brands.length < 2} onClick={() => del(b)}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
      </div>
      <div>
        <Button variant="ghost" disabled={busy} onClick={add}>
          <Plus size={14} /> Add a brand
        </Button>
      </div>
    </section>
  );
}

export function MembersSection({ team }: { team: TeamInfo }) {
  const { run, busy } = useRun();
  const [inviting, setInviting] = useState(false);
  const [access, setAccess] = useState<Member | null>(null);
  const brandsOf = (ids: string[] | null) => (ids ? team.brands.filter((b) => ids.includes(b.id)).map((b) => b.name).join(", ") || "No brands" : "All brands");
  const remove = async (m: Member) => {
    if (await askConfirm(`Remove ${m.name}?`, { body: `${m.email} loses access to this workspace.`, ok: "Remove", danger: true })) run(() => removeMemberFrom(m.userId), "Couldn't remove");
  };
  const withdraw = async (i: Invite) => {
    if (await askConfirm(`Withdraw the invite for ${i.email}?`, { ok: "Withdraw", danger: true })) run(() => withdrawInvite(i.id), "Couldn't withdraw");
  };
  const many = team.brands.length > 1;
  return (
    <section id="members" className="mt-10 flex scroll-mt-6 flex-col gap-4 border-t border-line pt-8">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-[15px] font-medium">Members</h2>
          <p className="text-[12px] text-muted">Who can open this workspace</p>
        </div>
        <Button variant="ghost" onClick={() => setInviting(true)}>
          <UserPlus size={14} /> Invite
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-frame">
        {team.members.map((m) => {
          const fixed = m.role === "owner" || m.userId === team.me;
          return (
            <div key={m.userId} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2 last:border-b-0">
              <Avatar label={m.name} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">
                  {m.name}
                  {m.userId === team.me ? <span className="font-normal text-faint"> (you)</span> : null}
                </p>
                <p className="truncate text-[11px] text-faint">
                  {m.email}
                  {many && (m.role === "editor" || m.role === "client") ? `, ${brandsOf(m.brandIds)}` : ""}
                </p>
              </div>
              {fixed ? (
                <Badge>{roleName(m.role)}</Badge>
              ) : (
                <div className="w-32">
                  <Select ariaLabel="Role" value={m.role} disabled={busy} onChange={(v) => run(() => saveMemberRole(m.userId, v), "Couldn't change the role")} options={ROLES} />
                </div>
              )}
              {many && (m.role === "editor" || m.role === "client") ? (
                <IconButton label="Brands" disabled={busy} onClick={() => setAccess(m)}>
                  <Users size={16} />
                </IconButton>
              ) : null}
              {!fixed ? (
                <IconButton label="Remove" disabled={busy} onClick={() => remove(m)}>
                  <Trash2 size={16} />
                </IconButton>
              ) : null}
            </div>
          );
        })}
        {team.invites.map((i) => (
          <div key={i.id} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2 last:border-b-0">
            <Avatar label={i.email} size={28} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{i.email}</p>
              <p className="truncate text-[11px] text-faint">
                {roleName(i.role)}
                {many && i.role !== "admin" ? `, ${brandsOf(i.brandIds)}` : ""}, until {fmtDate(i.expiresAt)}
              </p>
            </div>
            <Badge tone="yellow">Invited</Badge>
            {i.link ? <CopyButton text={i.link} label="Copy invite link" /> : null}
            <IconButton label="Withdraw invite" disabled={busy} onClick={() => withdraw(i)}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
      </div>
      {inviting ? <InviteDialog team={team} onClose={() => setInviting(false)} /> : null}
      {access ? <AccessDialog team={team} member={access} onClose={() => setAccess(null)} /> : null}
    </section>
  );
}

/** Pick brands: every brand, or some. null means all. */
function BrandPicks({ brands, value, onChange }: { brands: Brand[]; value: string[] | null; onChange: (v: string[] | null) => void }) {
  const on = (id: string) => value === null || value.includes(id);
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line">
      <label className="flex h-9 items-center gap-2 border-b border-line px-3 text-[13px]">
        <Checkbox checked={value === null} onChange={(v) => onChange(v ? null : [])} />
        All brands
      </label>
      {brands.map((b) => (
        <label key={b.id} className="flex h-9 items-center gap-2 px-3 text-[13px]">
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
        <div className="flex items-center gap-1">
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
          <Button type="button" variant="ghost" onClick={onClose}>
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
        className="flex flex-col gap-3"
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
          <Button type="button" variant="ghost" onClick={onClose}>
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
