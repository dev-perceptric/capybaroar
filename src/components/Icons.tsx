import { AppIcon } from "./AppIcon";

// Small line icons in one style. Each takes a size and a className.

type P = { size?: number; className?: string };

function Svg({ size = 16, className = "", children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
      {children}
    </svg>
  );
}

export const Inbox = (p: P) => (
  <Svg {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </Svg>
);

export const Building = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </Svg>
);

export const Users = (p: P) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

export const Kanban = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 7v7M12 7v4M16 7v9" />
  </Svg>
);

export const Settings = (p: P) => (
  <Svg {...p}>
    <path d="M20 7h-9M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </Svg>
);

export const SearchIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const ChevronsUpDown = (p: P) => (
  <Svg {...p}>
    <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
  </Svg>
);

export const ChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);

export const Refresh = (p: P) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Svg>
);

export const Plus = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M12 5v14" />
  </Svg>
);

export const Mail = (p: P) => (
  <Svg {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Svg>
);

export const Calendar = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

export const ArrowUpRight = (p: P) => (
  <Svg {...p}>
    <path d="M7 17 17 7M7 7h10v10" />
  </Svg>
);

export const ArrowDownLeft = (p: P) => (
  <Svg {...p}>
    <path d="M17 7 7 17M17 17H7V7" />
  </Svg>
);

export const Clock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Svg>
);

export const Video = (p: P) => (
  <Svg {...p}>
    <path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 10.5" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </Svg>
);

export const Dollar = (p: P) => (
  <Svg {...p}>
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

export const Tag = (p: P) => (
  <Svg {...p}>
    <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" />
    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
  </Svg>
);

export const Globe = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

export const LogOut = (p: P) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

export const Sparkles = (p: P) => (
  <Svg {...p}>
    <path d="M9.9 15.5A2 2 0 0 0 8.5 14l-6.1-1.6a.5.5 0 0 1 0-1L8.5 10A2 2 0 0 0 10 8.5l1.6-6.1a.5.5 0 0 1 1 0L14 8.5a2 2 0 0 0 1.5 1.4l6.1 1.6a.5.5 0 0 1 0 1L15.5 14a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z" />
  </Svg>
);

export const Sun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const Check = (p: P) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const Bot = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 13h.01M15 13h.01M2 14h2M20 14h2" />
  </Svg>
);

export const Send = (p: P) => (
  <Svg {...p}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
);

export const Target = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </Svg>
);

export const X = (p: P) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const ListIcon = (p: P) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Svg>
);

export const Bookmark = (p: P) => (
  <Svg {...p}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);

export const Briefcase = (p: P) => (
  <Svg {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20" />
  </Svg>
);

export const School = (p: P) => (
  <Svg {...p}>
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c3 2 9 2 12 0v-5" />
  </Svg>
);

export const Download = (p: P) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </Svg>
);

export const Filter = (p: P) => (
  <Svg {...p}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
  </Svg>
);

export const Code = (p: P) => (
  <Svg {...p}>
    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
  </Svg>
);

export const Flame = (p: P) => (
  <Svg {...p}>
    <path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4S9 10 10.5 10C10.5 6 12 2 12 2z" />
  </Svg>
);

export const Radar = (p: P) => (
  <Svg {...p}>
    <path d="M19.07 4.93A10 10 0 1 0 22 12" />
    <path d="M16.24 7.76A6 6 0 1 0 18 12" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="m12 12 7-7" />
  </Svg>
);

export const Play = (p: P) => (
  <Svg {...p}>
    <path d="M6 4l14 8-14 8z" />
  </Svg>
);

export const Pause = (p: P) => (
  <Svg {...p}>
    <path d="M8 5v14M16 5v14" />
  </Svg>
);

export const Linkedin = (p: P) => (
  <Svg {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
  </Svg>
);

export const Phone = (p: P) => (
  <Svg {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </Svg>
);

export const Trash = (p: P) => (
  <Svg {...p}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Svg>
);

export const Eye = (p: P) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const ThumbsUp = (p: P) => (
  <Svg {...p}>
    <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zM7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7" />
  </Svg>
);

export const ThumbsDown = (p: P) => (
  <Svg {...p}>
    <path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3zM17 14l-4 8a3 3 0 0 1-3-3v-4H4.5a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.9 3H17" />
  </Svg>
);

export const ArrowUp = (p: P) => (
  <Svg {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);

export const MapPin = (p: P) => (
  <Svg {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

export const UserPlus = (p: P) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" />
  </Svg>
);

/** Google's "G", in its own colors. */
export function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export const Book = (p: P) => (
  <Svg {...p}>
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </Svg>
);

export const Upload = (p: P) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </Svg>
);

export const StickyNote = (p: P) => (
  <Svg {...p}>
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
    <path d="M15 3v6h6" />
  </Svg>
);

export const CheckSquare = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="m8.5 12 2.5 2.5 5-5" />
  </Svg>
);

export const MessageCircle = (p: P) => (
  <Svg {...p}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </Svg>
);

export const PanelLeft = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </Svg>
);

export const Handshake = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" />
  </Svg>
);

export const Copy = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Svg>
);

export const Merge = (p: P) => (
  <Svg {...p}>
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="12" r="2.5" />
    <path d="M6 8.5v7M8.5 6h2a5 5 0 0 1 5 5v-1" />
  </Svg>
);

export const Pencil = (p: P) => (
  <Svg {...p}>
    <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  </Svg>
);

export const ExternalLink = (p: P) => (
  <Svg {...p}>
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Svg>
);

export const CalendarPlus = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18M12 14v5M9.5 16.5h5" />
  </Svg>
);

export const AlertTriangle = (p: P) => (
  <Svg {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const ArrowUpDown = (p: P) => (
  <Svg {...p}>
    <path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16" />
  </Svg>
);

export const Columns = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M15 3v18" />
  </Svg>
);

export const Unlink = (p: P) => (
  <Svg {...p}>
    <path d="m18.84 12.25 1.72-1.71a4.95 4.95 0 0 0-7-7l-1.71 1.72M5.17 11.75l-1.71 1.71a4.95 4.95 0 0 0 7 7l1.71-1.71M8 2v3M2 8h3M16 22v-3M22 16h-3" />
  </Svg>
);
export const Lock = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="10" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);
export const CreditCard = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" />
    <path d="M3 10h18M7 15h4" />
  </Svg>
);

/** The Microsoft four squares, for sign-in buttons. */
export function MicrosoftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="6.5" height="6.5" fill="#f25022" />
      <rect x="8.5" y="1" width="6.5" height="6.5" fill="#7fba00" />
      <rect x="1" y="8.5" width="6.5" height="6.5" fill="#00a4ef" />
      <rect x="8.5" y="8.5" width="6.5" height="6.5" fill="#ffb900" />
    </svg>
  );
}
export const Bell = (p: P) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Svg>
);
export const UserIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);

export const Box = (p: P) => (
  <Svg {...p}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </Svg>
);

export const Folder = (p: P) => (
  <Svg {...p}>
    <path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" />
  </Svg>
);

export const Home = (p: P) => (
  <Svg {...p}>
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v10h14V10M10 20v-5h4v5" />
  </Svg>
);

export const Ticket = (p: P) => (
  <Svg {...p}>
    <path d="M3 8V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z" transform="translate(0 2)" />
    <path d="M14 7v10" strokeDasharray="2 2" />
  </Svg>
);

export const FileIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Svg>
);

export const Star = (p: P) => (
  <Svg {...p}>
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3z" />
  </Svg>
);

export const Flag = (p: P) => (
  <Svg {...p}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </Svg>
);

/** Pulse: dots around a center. */
export const Orbit = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="12" r="8" strokeDasharray="2 3" />
    <circle cx="19" cy="8" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="6" cy="17" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
);

/** Rules: when this, then that. */
export const Workflow = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="6" height="6" />
    <rect x="15" y="14" width="6" height="6" />
    <path d="M9 7h4a2 2 0 0 1 2 2v5M13 12l2 2 2-2" />
  </Svg>
);

/** A grid of rows and columns. */
export const TableIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" />
    <path d="M3 10h18M3 15h18M9 10v10" />
  </Svg>
);
/** Lines of choices, for a view's options. */
export const Sliders = (p: P) => (
  <Svg {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <rect x="14" y="4" width="4" height="4" />
    <rect x="8" y="10" width="4" height="4" />
    <rect x="16" y="16" width="4" height="4" />
  </Svg>
);
/** Tiles of numbers and charts. */
export const Dashboard = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </Svg>
);
/** Objects and the fields on them: the data model. */
export const Schema = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="5" />
    <rect x="14" y="16" width="7" height="5" />
    <rect x="14" y="9" width="7" height="5" />
    <path d="M6.5 8v10.5H14M6.5 11.5H14" />
  </Svg>
);
/** A workflow branch: one path splitting in two. */
export const Branch = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v6M12 9l-6 6v6M12 9l6 6v6" />
  </Svg>
);
export const LinkIcon = (p: P) => (
  <Svg {...p}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
  </Svg>
);

/** The icon a custom object picked. */
/** A custom object's icon: one of the first eight by name, else any picked icon or emoji. */
export function ObjectIcon({ name, ...p }: P & { name: string }) {
  const I = ({ box: Box, folder: Folder, home: Home, briefcase: Briefcase, ticket: Ticket, file: FileIcon, star: Star, flag: Flag } as Record<string, (p: P) => React.ReactElement>)[name];
  if (I) return <I {...p} />;
  return <AppIcon name={name} size={p.size ?? 16} className={p.className} fallback={<Box {...p} />} />;
}

export const Expand = (p: P) => (
  <Svg {...p}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </Svg>
);

export const ChevronUp = (p: P) => (
  <Svg {...p}>
    <path d="m18 15-6-6-6 6" />
  </Svg>
);

export const ChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const Undo = (p: P) => (
  <Svg {...p}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
  </Svg>
);

export const MoreHorizontal = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </Svg>
);

export const Redo = (p: P) => (
  <Svg {...p}>
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
  </Svg>
);

export const Minus = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);

export const Archive = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </Svg>
);

export const ShieldCheck = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const ListTree = (p: P) => (
  <Svg {...p}>
    <path d="M21 12h-8" />
    <path d="M21 6H8" />
    <path d="M21 18h-8" />
    <path d="M3 6v4c0 1.1.9 2 2 2h3" />
    <path d="M3 10v6c0 1.1.9 2 2 2h3" />
  </Svg>
);

export const Flask = (p: P) => (
  <Svg {...p}>
    <path d="M9 3h6" />
    <path d="M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" />
    <path d="M7 15h10" />
  </Svg>
);
export const ArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const ArrowLeft = (p: P) => (
  <Svg {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Svg>
);

export const Ban = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.7 5.7 12.6 12.6" />
  </Svg>
);

export const Reply = (p: P) => (
  <Svg {...p}>
    <path d="M9 17 4 12l5-5" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </Svg>
);

export const Moon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Svg>
);

export const Paperclip = (p: P) => (
  <Svg {...p}>
    <path d="m21 11-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6L15.5 7" />
  </Svg>
);

export const Mic = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Svg>
);

export const StopSquare = (p: P) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" className={`shrink-0 ${p.className ?? ""}`} aria-hidden="true">
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />
  </svg>
);
