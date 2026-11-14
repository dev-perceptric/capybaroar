// Subprocessor change notices, the pure half: which vendors need a notice now, and whether a start date gives enough
// notice. compliance/subprocessors.json gives a new vendor a "starts" date; the notice goes out once, as soon as the
// vendor is in the file, and the date must be at least `notice_days` after the day it was added ("updated").
export type Vendor = { id: string; name: string; purpose: string; data: string; location: string; active: boolean; starts?: string };
export type SubsFile = { updated: string; notice_days: number; subprocessors: Vendor[] };

const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const DAY = 86400000;

/** Vendors with a start date still ahead (or today) that haven't had their notice finished. */
export function toAnnounce(file: SubsFile, done: { vendor_id: string; starts: string }[], today: string): Vendor[] {
  const finished = new Set(done.map((d) => `${d.vendor_id}@${d.starts}`));
  return file.subprocessors.filter((v) => v.starts && /^\d{4}-\d{2}-\d{2}$/.test(v.starts) && day(v.starts) >= day(today) && !finished.has(`${v.id}@${v.starts}`));
}

/** Vendors whose start date comes sooner than the promised notice after the list was updated. */
export function tooSoon(file: SubsFile): Vendor[] {
  return file.subprocessors.filter((v) => v.starts && (day(v.starts) - day(file.updated)) / DAY < file.notice_days);
}

/** Whether a vendor should show in the main list yet: active, and its start date (if any) has come. */
export const isLive = (v: Vendor, today: string) => v.active && (!v.starts || day(v.starts) <= day(today));
