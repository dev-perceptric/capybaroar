import { Suspense, useId } from "react";
import { isLucide, LucideIcon } from "./AppIcon";

// The drawing on an empty screen, like Twenty's: a tile seen from above at an angle, sitting on a soft plate, with the
// tool's sign drawn on its top. Black lines, white top, dotted gray sides. Each sign is drawn flat on a 24-unit square
// and laid onto the tile with one isometric transform, so every drawing shares the same angle and line weight.
// A custom object passes its own icon, and that icon is laid onto the tile the same way. Some drawings add a small
// second tile beside the first (`MINI`), sharing the same plate: a campaign and its people, a sequence and its clock.

export type DrawingKind =
  | "records"
  | "people"
  | "deals"
  | "meetings"
  | "notes"
  | "tasks"
  | "inbox"
  | "emails"
  | "files"
  | "timeline"
  | "campaigns"
  | "library"
  | "lists"
  | "dashboards"
  | "knowledge"
  | "experiences"
  | "pulse"
  | "search"
  | "audience"
  | "activity"
  | "workflow"
  | "sender"
  | "approval"
  | "live"
  | "nomatch"
  | "replies";

const SIGNS: Record<DrawingKind, React.ReactNode> = {
  records: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 14h18M9 4v16" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.2-6.5 8-6.5s7 2.5 8 6.5" />
    </>
  ),
  deals: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
      <rect x="16" y="4" width="5" height="7" rx="1.5" />
    </>
  ),
  meetings: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M8 14h3M8 17h6" />
    </>
  ),
  notes: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4M9 11h7M9 14h7M9 17h4" />
    </>
  ),
  tasks: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m7.5 12.5 3 3 6-7" />
    </>
  ),
  inbox: (
    <>
      <path d="M21 12h-5l-2 3h-4l-2-3H3" />
      <path d="M6 5h12l3 7v7H3v-7z" />
    </>
  ),
  emails: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  files: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M12 17v-6M9.5 13.5 12 11l2.5 2.5" />
    </>
  ),
  timeline: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <path d="M6 8v8M11 6h10M11 18h10M11 12h6" />
    </>
  ),
  campaigns: <path d="m3 11 18-8-6 18-3-7.5zM12 13.5 21 3" />,
  library: (
    <>
      <path d="M3 6.5V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8.5a1 1 0 0 0-1-1h-8L10 5H4a1 1 0 0 0-1 1.5z" />
      <path d="M3 11h18" />
    </>
  ),
  lists: (
    <>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <circle cx="4.5" cy="6" r="1.5" />
      <circle cx="4.5" cy="12" r="1.5" />
      <circle cx="4.5" cy="18" r="1.5" />
    </>
  ),
  dashboards: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16v-4M11.5 16V8M16 16v-6M20.5 16V5" />
    </>
  ),
  knowledge: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z" />
      <path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3M8 7h8M8 10.5h5" />
    </>
  ),
  experiences: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8.5h20M5 6.25h.01M7.5 6.25h.01M6 12h7M6 15.5h4M15.5 12h3v4.5h-3z" />
    </>
  ),
  pulse: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="17" cy="7.5" r="1.4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  audience: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20.5c.8-3.6 3.4-5.8 6.5-5.8s5.7 2.2 6.5 5.8" />
      <circle cx="17" cy="6.5" r="2.8" />
      <path d="M17.5 12.3c2.3.4 3.7 2.2 4.2 4.7" />
    </>
  ),
  activity: <path d="M2 12.5h4.5l2.5-6 4 12 3-8.5 1.8 2.5H22" />,
  workflow: (
    <>
      <rect x="8" y="2.5" width="8" height="5.5" rx="1.3" />
      <rect x="2.5" y="16" width="8" height="5.5" rx="1.3" />
      <rect x="13.5" y="16" width="8" height="5.5" rx="1.3" />
      <path d="M12 8v4M6.5 16v-4h11v4" />
    </>
  ),
  sender: <path d="M9 2.5v5M15 2.5v5M5.5 7.5h13v3.5a6.5 6.5 0 0 1-13 0zM12 17.5v4" />,
  approval: (
    <>
      <path d="M12 2.5 19.5 5.5v6c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5v-6z" />
      <path d="m8.5 12 2.6 2.6 4.4-5" />
    </>
  ),
  live: <path d="M5 21.5V3.5M5 4h12l-2.5 4.5L17 13H5" />,
  nomatch: <path d="M3 5h18l-7 8.5V20l-4-2v-4.5z" />,
  replies: (
    <>
      <path d="M21 12h-5l-2 3h-4l-2-3H3" />
      <path d="M6 5h12l3 7v7H3v-7z" />
    </>
  ),
};

// The small tile's sign, for the drawings that have one.
const MINI: Partial<Record<DrawingKind, React.ReactNode>> = {
  campaigns: SIGNS.people,
  audience: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12 18.5 5.5" />
    </>
  ),
  activity: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16.5 9.5" />
    </>
  ),
  workflow: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  sender: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5v6M8 7.5v.01M12 16.5v-6M12 13a2.5 2.5 0 0 1 5 0v3.5" />
    </>
  ),
  approval: (
    <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  live: SIGNS.campaigns,
  nomatch: SIGNS.search,
  replies: (
    <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
};

// Flat (x, y) on the tile to the screen: 30° isometric.
const C = 0.866;
const iso = (x: number, y: number, z = 0): [number, number] => [(x - y) * C, (x + y) * 0.5 - z];
const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** One tile at (ox, oy) on the ground: its two dotted sides, its white top and its sign. */
function Tile({ ox, oy, h, t, k, dots, children }: { ox: number; oy: number; h: number; t: number; k: number; dots: string; children: React.ReactNode }) {
  const P = (x: number, y: number, z = 0) => iso(ox + x, oy + y, z);
  const top = [P(-h, -h, t), P(h, -h, t), P(h, h, t), P(-h, h, t)];
  const left = [P(-h, h, t), P(h, h, t), P(h, h), P(-h, h)];
  const right = [P(h, -h, t), P(h, h, t), P(h, h), P(h, -h)];
  const sign = `matrix(${C * k} ${0.5 * k} ${-C * k} ${0.5 * k} ${P(-12 * k, -12 * k, t).join(" ")})`;
  return (
    <>
      <g stroke="var(--text-primary)" strokeWidth="1.5" strokeLinejoin="round">
        <polygon points={pts(left)} fill="var(--bg-quaternary)" />
        <polygon points={pts(left)} fill={`url(#${dots})`} />
        <polygon points={pts(right)} fill="var(--bg-tertiary)" />
        <polygon points={pts(right)} fill={`url(#${dots})`} />
        <polygon points={pts(top)} fill="var(--bg-primary)" />
      </g>
      <g transform={sign} stroke="var(--text-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" className="[&_*]:[vector-effect:non-scaling-stroke]">
        {children}
      </g>
    </>
  );
}

export function Drawing({ kind = "records", icon, size = 220 }: { kind?: DrawingKind; icon?: string | null; size?: number }) {
  const dots = useId().replace(/:/g, "");
  const h = 40; // half the tile's side
  const t = 12; // the tile's thickness
  const mini = icon ? undefined : MINI[kind];
  // The plate under the tiles: a rounded square flat on the ground, longer when a small tile sits beside the first.
  const plate = `matrix(${C} 0.5 ${-C} 0.5 0 0)`;
  const [x0, y0, x1, y1] = mini ? [-62, -62, 99, 57] : [-h - 22, -h - 22, h + 22, h + 22];
  const [vx, vy, vw, vh] = mini ? [-108, -66, 252, 148] : [-110, -62, 220, 150];
  const main = isLucide(icon) ? (
    <Suspense fallback={null}>
      <LucideIcon name={icon} width={24} height={24} strokeWidth={1.6} style={{ color: "var(--text-primary)" }} fallback={() => null} />
    </Suspense>
  ) : (
    SIGNS[kind]
  );
  return (
    <svg width={size} height={(size * vh) / vw} viewBox={`${vx} ${vy} ${vw} ${vh}`} fill="none" aria-hidden="true" className="shrink-0">
      <defs>
        <pattern id={dots} width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.55" fill="var(--text-primary)" opacity="0.45" />
        </pattern>
      </defs>
      <g transform={plate}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="22" fill="var(--bg-tertiary)" stroke="var(--text-primary)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </g>
      <Tile ox={0} oy={0} h={h} t={t} k={2.7} dots={dots}>
        {main}
      </Tile>
      {mini ? (
        <Tile ox={60} oy={18} h={17} t={7} k={1.1} dots={dots}>
          {mini}
        </Tile>
      ) : null}
    </svg>
  );
}
