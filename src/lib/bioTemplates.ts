// Link-in-bio templates: a look and a list of blocks for a kind of page, as plain data. Every link, video and email
// starts as a placeholder (src/lib/bioBlocks.ts), so the editor marks it and a page can't be saved until the person
// puts their own in. Social icons and latest posts fill from the brand's connected channels when a template is
// applied. Pure, so the editor, the AI builder and tests/bioTemplates.test.ts share it.

import {
  PLACEHOLDER_EMAIL,
  PLACEHOLDER_VIDEO,
  newBlockId,
  placeholderUrl,
  type Appearance,
  type Block,
  type SocialId,
  type SocialItem,
} from "./bioBlocks";

/** A block as a template holds it: no id yet, and a scheduled link's end as days from when it's applied. */
export type TemplateBlock =
  | { type: "link"; label: string; endsInDays?: number }
  | { type: "header"; text: string }
  | { type: "text"; text: string }
  | { type: "social"; networks: SocialId[] }
  | { type: "posts"; count: number }
  | { type: "video"; title: string }
  | { type: "email"; label: string; subject?: string };

export type BioTemplate = { id: string; name: string; line: string; tags: string[]; appearance: Appearance; blocks: TemplateBlock[] };

const link = (label: string, endsInDays?: number): TemplateBlock => ({ type: "link", label, ...(endsInDays ? { endsInDays } : {}) });
const header = (text: string): TemplateBlock => ({ type: "header", text });
const text = (t: string): TemplateBlock => ({ type: "text", text: t });
const social = (...networks: SocialId[]): TemplateBlock => ({ type: "social", networks });
const posts = (count = 6): TemplateBlock => ({ type: "posts", count });
const video = (title: string): TemplateBlock => ({ type: "video", title });
const email = (label: string, subject?: string): TemplateBlock => ({ type: "email", label, ...(subject ? { subject } : {}) });
const look = (theme: Appearance["theme"], shape: Appearance["shape"], fill: Appearance["fill"] = "solid", size: Appearance["size"] = "normal"): Appearance => ({ theme, shape, fill, size });

export const BIO_TEMPLATES: BioTemplate[] = [
  {
    id: "simple",
    name: "Simple",
    line: "Your profiles and a few links",
    tags: ["anyone"],
    appearance: look("light", "pill"),
    blocks: [social("instagram", "tiktok", "youtube"), link("My website"), link("Latest news"), link("Contact")],
  },
  {
    id: "creator",
    name: "Creator",
    line: "Latest posts, videos and brand deals",
    tags: ["creator", "influencer"],
    appearance: look("blush", "pill"),
    blocks: [social("instagram", "tiktok", "youtube"), video("Latest video"), link("Shop my picks"), link("My gear"), header("Latest posts"), posts(6), email("Work with me", "Partnership")],
  },
  {
    id: "cafe",
    name: "Cafe and restaurant",
    line: "Menu, bookings and directions",
    tags: ["coffee shop", "restaurant", "bar"],
    appearance: look("paper", "rounded"),
    blocks: [link("See the menu"), link("Book a table"), link("Order for pickup"), link("Find us"), header("From our kitchen"), posts(3), social("instagram", "tiktok", "facebook")],
  },
  {
    id: "shop",
    name: "Online shop",
    line: "New arrivals, best sellers and care",
    tags: ["local shop", "e-commerce", "retail"],
    appearance: look("sand", "rounded"),
    blocks: [link("Shop new arrivals"), link("Best sellers"), link("Gift cards"), link("Shipping and returns"), header("As seen on our feed"), posts(6), social("instagram", "tiktok", "pinterest"), email("Customer care", "Order question")],
  },
  {
    id: "studio",
    name: "Agency and studio",
    line: "Work, services and a call to book",
    tags: ["agency", "studio", "freelancer"],
    appearance: look("dark", "square", "outline"),
    blocks: [link("See our work"), link("Services"), link("Book a call"), header("Recent projects"), posts(6), email("Start a project", "New project"), social("linkedin", "instagram", "x")],
  },
  {
    id: "podcast",
    name: "Podcast",
    line: "Latest episode and where to listen",
    tags: ["podcast", "show"],
    appearance: look("sky", "pill"),
    blocks: [video("Latest episode"), link("Listen on Spotify"), link("Listen on Apple Podcasts"), link("All episodes"), email("Be a guest", "Guest idea"), social("youtube", "instagram", "tiktok", "spotify")],
  },
  {
    id: "music",
    name: "Musician and band",
    line: "New release, tour dates and merch",
    tags: ["musician", "band", "artist"],
    appearance: look("dark", "pill", "solid", "large"),
    blocks: [link("Stream the new single"), video("New music video"), link("Tour dates"), link("Merch"), social("spotify", "instagram", "youtube", "tiktok")],
  },
  {
    id: "coach",
    name: "Coach and consultant",
    line: "Book an intro call, programs, free guide",
    tags: ["coach", "consultant", "therapist"],
    appearance: look("sage", "rounded"),
    blocks: [link("Book an intro call"), link("Programs"), link("Free guide"), link("Client stories"), video("Watch my talk"), email("Get in touch"), social("linkedin", "instagram", "youtube")],
  },
  {
    id: "fitness",
    name: "Fitness and gym",
    line: "Classes, schedule and memberships",
    tags: ["gym", "fitness", "trainer", "yoga"],
    appearance: look("dark", "rounded", "solid", "large"),
    blocks: [link("Book a class"), link("Class schedule"), link("Memberships"), video("Workout of the week"), header("At the gym"), posts(6), social("instagram", "tiktok", "youtube")],
  },
  {
    id: "photo",
    name: "Photographer",
    line: "Portfolio first, then bookings",
    tags: ["photographer", "portfolio", "artist"],
    appearance: look("light", "square", "outline"),
    blocks: [posts(9), link("Portfolio"), link("Book a session"), link("Prints"), email("Enquiries", "Booking enquiry"), social("instagram", "pinterest")],
  },
  {
    id: "event",
    name: "Event and launch",
    line: "Tickets, schedule and venue",
    tags: ["event", "launch", "conference"],
    appearance: look("sand", "pill", "solid", "large"),
    blocks: [link("Early bird tickets", 14), link("Get tickets"), link("Schedule"), link("Venue and travel"), video("Event trailer"), social("instagram", "linkedin", "x")],
  },
  {
    id: "nonprofit",
    name: "Nonprofit",
    line: "Donate, volunteer and stay in touch",
    tags: ["nonprofit", "charity", "community"],
    appearance: look("sage", "pill"),
    blocks: [link("Donate"), link("Volunteer"), link("What we do"), link("Join our newsletter"), header("Latest updates"), posts(3), email("Contact us"), social("instagram", "facebook", "linkedin")],
  },
  {
    id: "realestate",
    name: "Real estate agent",
    line: "Listings, viewings and valuations",
    tags: ["real estate", "realtor", "property"],
    appearance: look("paper", "square"),
    blocks: [link("Current listings"), link("Book a viewing"), link("Home valuation"), link("Recent sales"), video("Property tour"), email("Contact me", "Property enquiry"), social("instagram", "facebook", "linkedin")],
  },
  {
    id: "saas",
    name: "Startup and SaaS",
    line: "Try it, book a demo, read the docs",
    tags: ["saas", "startup", "app"],
    appearance: look("light", "rounded"),
    blocks: [link("Try it"), link("Book a demo"), video("Product tour"), link("Pricing"), link("Docs"), link("Changelog"), social("x", "linkedin", "github", "youtube")],
  },
  {
    id: "author",
    name: "Author and newsletter",
    line: "Subscribe, read the latest, buy the book",
    tags: ["author", "writer", "newsletter"],
    appearance: look("paper", "rounded", "outline"),
    blocks: [link("Subscribe to the newsletter"), link("Read the latest issue"), link("Buy the book"), link("Events and talks"), text("Questions or invitations? Send me an email."), email("Get in touch"), social("instagram", "x", "threads")],
  },
];

export const templateOf = (id: string | null | undefined) => BIO_TEMPLATES.find((t) => t.id === id) ?? null;

const DAY = 86400000;

/** One template block as a page block, with a new id. Links, videos and emails are placeholders. */
export function blockFrom(t: TemplateBlock, social: SocialItem[], now: Date): Block {
  const id = newBlockId();
  switch (t.type) {
    case "link":
      return { id, type: "link", label: t.label, url: placeholderUrl(t.label), thumb: null, start: null, end: t.endsInDays ? new Date(now.getTime() + t.endsInDays * DAY).toISOString() : null };
    case "header":
    case "text":
      return { id, type: t.type, text: t.text };
    case "social":
      // The brand's own profiles when it has any; else the template's networks, each waiting for a link.
      return { id, type: "social", items: social.length ? social.map(({ network, url }) => ({ network, url })) : t.networks.map((n) => ({ network: n, url: placeholderUrl(n) })) };
    case "posts":
      return { id, type: "posts", count: t.count, links: {} };
    case "video":
      return { id, type: "video", url: PLACEHOLDER_VIDEO, title: t.title, thumb: null };
    case "email":
      return { id, type: "email", label: t.label, email: PLACEHOLDER_EMAIL, ...(t.subject ? { subject: t.subject } : {}) };
  }
}

/** A template's blocks and look for a page, social icons from the brand's channels. */
export function applyTemplate(t: BioTemplate, social: SocialItem[], now = new Date()): { blocks: Block[]; appearance: Appearance } {
  return { blocks: t.blocks.map((b) => blockFrom(b, social, now)), appearance: { ...t.appearance } };
}

/** The catalog in a few words per template, for the AI builder's prompt. */
export function catalogText(): string {
  const shape = (b: TemplateBlock) => {
    switch (b.type) {
      case "link":
        return `link "${b.label}"`;
      case "header":
      case "text":
        return `${b.type} "${b.text}"`;
      case "social":
        return "social";
      case "posts":
        return `posts(${b.count})`;
      case "video":
        return `video "${b.title}"`;
      case "email":
        return `email "${b.label}"`;
    }
  };
  return BIO_TEMPLATES.map((t) => `- ${t.id}: ${t.name}, ${t.line.toLowerCase()} (${t.tags.join(", ")}). Look: ${t.appearance.theme}, ${t.appearance.shape}, ${t.appearance.fill}, ${t.appearance.size}. Blocks: ${t.blocks.map(shape).join("; ")}`).join("\n");
}
