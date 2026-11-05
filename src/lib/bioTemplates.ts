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

/** group: the gallery's filter it sits under. */
export type BioTemplate = { id: string; name: string; line: string; group: TemplateGroup; tags: string[]; appearance: Appearance; blocks: TemplateBlock[] };
export type TemplateGroup = "creators" | "business" | "food" | "events" | "personal";
export const TEMPLATE_GROUPS: { id: TemplateGroup; name: string }[] = [
  { id: "creators", name: "Creators" },
  { id: "business", name: "Business" },
  { id: "food", name: "Food and drink" },
  { id: "events", name: "Events" },
  { id: "personal", name: "Personal" },
];

const link = (label: string, endsInDays?: number): TemplateBlock => ({ type: "link", label, ...(endsInDays ? { endsInDays } : {}) });
const header = (text: string): TemplateBlock => ({ type: "header", text });
const text = (t: string): TemplateBlock => ({ type: "text", text: t });
const social = (...networks: SocialId[]): TemplateBlock => ({ type: "social", networks });
const posts = (count = 6): TemplateBlock => ({ type: "posts", count });
const video = (title: string): TemplateBlock => ({ type: "video", title });
const email = (label: string, subject?: string): TemplateBlock => ({ type: "email", label, ...(subject ? { subject } : {}) });
const look = (theme: Appearance["theme"], shape: Appearance["shape"], fill: Appearance["fill"] = "solid", size: Appearance["size"] = "normal", font: Appearance["font"] = "inter"): Appearance => ({ theme, shape, fill, size, font });

export const BIO_TEMPLATES: BioTemplate[] = [
  // Creators
  {
    id: "creator", name: "Creator", line: "Latest posts, videos and brand deals", group: "creators", tags: ["creator", "influencer"],
    appearance: look("sunset", "pill", "solid", "normal", "display"),
    blocks: [social("instagram", "tiktok", "youtube"), video("Latest video"), link("Shop my picks"), link("My gear"), header("Latest posts"), posts(6), email("Work with me", "Partnership")],
  },
  {
    id: "streamer", name: "Gamer and streamer", line: "Live now, clips, setup and schedule", group: "creators", tags: ["gamer", "streamer", "twitch"],
    appearance: look("midnight", "rounded", "glass", "normal", "grotesk"),
    blocks: [link("Watch me live"), video("Best clip this week"), link("Stream schedule"), link("My setup"), link("Join the Discord"), email("Sponsorships", "Sponsorship"), social("twitch", "youtube", "tiktok", "x")],
  },
  {
    id: "podcast", name: "Podcast", line: "Latest episode and where to listen", group: "creators", tags: ["podcast", "show"],
    appearance: look("aurora", "pill", "glass", "normal", "display"),
    blocks: [video("Latest episode"), link("Listen on Spotify"), link("Listen on Apple Podcasts"), link("All episodes"), email("Be a guest", "Guest idea"), social("youtube", "instagram", "tiktok", "spotify")],
  },
  {
    id: "music", name: "Musician and band", line: "New release, tour dates and merch", group: "creators", tags: ["musician", "band", "artist"],
    appearance: look("midnight", "pill", "glass", "large", "display"),
    blocks: [link("Stream the new single"), video("New music video"), link("Tour dates"), link("Merch"), social("spotify", "instagram", "youtube", "tiktok")],
  },
  {
    id: "dj", name: "DJ and nightlife", line: "Next gigs, mixes and bookings", group: "creators", tags: ["dj", "nightlife", "club"],
    appearance: look("noir", "square", "outline", "large", "mono"),
    blocks: [link("Next gigs"), link("Latest mix"), video("Live set"), link("Press kit"), email("Bookings", "Booking request"), social("instagram", "spotify", "youtube", "tiktok")],
  },
  {
    id: "artist", name: "Artist and illustrator", line: "Shop prints, commissions and process", group: "creators", tags: ["artist", "illustrator", "designer"],
    appearance: look("candy", "rounded", "hard", "normal", "rounded"),
    blocks: [link("Shop prints"), link("Commissions open"), header("Fresh from the studio"), posts(6), link("Patreon"), email("Say hi", "Commission"), social("instagram", "tiktok", "pinterest")],
  },
  {
    id: "photo", name: "Photographer", line: "Portfolio first, then bookings", group: "creators", tags: ["photographer", "portfolio"],
    appearance: look("light", "square", "outline", "normal", "serif"),
    blocks: [posts(9), link("Portfolio"), link("Book a session"), link("Prints"), email("Enquiries", "Booking enquiry"), social("instagram", "pinterest")],
  },
  {
    id: "travel", name: "Travel creator", line: "Guides, gear and where I am now", group: "creators", tags: ["travel", "blogger", "adventure"],
    appearance: look("ocean", "pill", "solid", "normal", "display"),
    blocks: [video("Latest trip"), link("My travel guides"), link("Gear I pack"), link("Where I'm headed next"), header("On the road"), posts(6), social("instagram", "youtube", "tiktok")],
  },
  // Business
  {
    id: "shop", name: "Online shop", line: "New arrivals, best sellers and care", group: "business", tags: ["local shop", "e-commerce", "retail"],
    appearance: look("peach", "rounded", "solid", "normal", "display"),
    blocks: [link("Shop new arrivals"), link("Best sellers"), link("Gift cards"), link("Shipping and returns"), header("As seen on our feed"), posts(6), social("instagram", "tiktok", "pinterest"), email("Customer care", "Order question")],
  },
  {
    id: "fashion", name: "Fashion brand", line: "The new drop, lookbook and stores", group: "business", tags: ["fashion", "clothing", "streetwear"],
    appearance: look("noir", "square", "solid", "normal", "serif"),
    blocks: [link("Shop the new drop"), link("Lookbook"), header("Worn by you"), posts(6), link("Find a store"), social("instagram", "tiktok", "pinterest")],
  },
  {
    id: "beauty", name: "Beauty and salon", line: "Book, treatments and prices", group: "business", tags: ["salon", "beauty", "spa", "barber"],
    appearance: look("lavender", "pill", "solid", "normal", "serif"),
    blocks: [link("Book an appointment"), link("Treatments and prices"), link("Gift vouchers"), header("Recent work"), posts(6), link("Find us"), social("instagram", "tiktok", "facebook")],
  },
  {
    id: "studio", name: "Agency and studio", line: "Work, services and a call to book", group: "business", tags: ["agency", "studio", "freelancer"],
    appearance: look("dark", "square", "outline", "normal", "grotesk"),
    blocks: [link("See our work"), link("Services"), link("Book a call"), header("Recent projects"), posts(6), email("Start a project", "New project"), social("linkedin", "instagram", "x")],
  },
  {
    id: "saas", name: "Startup and SaaS", line: "Try it, book a demo, read the docs", group: "business", tags: ["saas", "startup", "app"],
    appearance: look("lime", "rounded", "hard", "normal", "grotesk"),
    blocks: [link("Try it free"), link("Book a demo"), video("Product tour"), link("Pricing"), link("Docs"), link("Changelog"), social("x", "linkedin", "github", "youtube")],
  },
  {
    id: "coach", name: "Coach and consultant", line: "Book an intro call, programs, free guide", group: "business", tags: ["coach", "consultant", "therapist"],
    appearance: look("sage", "rounded", "solid", "normal", "serif"),
    blocks: [link("Book an intro call"), link("Programs"), link("Free guide"), link("Client stories"), video("Watch my talk"), email("Get in touch"), social("linkedin", "instagram", "youtube")],
  },
  {
    id: "fitness", name: "Fitness and gym", line: "Classes, schedule and memberships", group: "business", tags: ["gym", "fitness", "trainer"],
    appearance: look("lime", "square", "hard", "large", "display"),
    blocks: [link("Book a class"), link("Class schedule"), link("Memberships"), video("Workout of the week"), header("At the gym"), posts(6), social("instagram", "tiktok", "youtube")],
  },
  {
    id: "wellness", name: "Wellness and yoga", line: "Classes, retreats and a free session", group: "business", tags: ["yoga", "wellness", "pilates", "meditation"],
    appearance: look("forest", "pill", "solid", "normal", "serif"),
    blocks: [link("Book a class"), link("Try a free session"), link("Retreats"), video("A 10 minute flow"), header("From the studio"), posts(3), social("instagram", "youtube", "tiktok")],
  },
  {
    id: "realestate", name: "Real estate agent", line: "Listings, viewings and valuations", group: "business", tags: ["real estate", "realtor", "property"],
    appearance: look("paper", "square", "solid", "normal", "serif"),
    blocks: [link("Current listings"), link("Book a viewing"), link("Home valuation"), link("Recent sales"), video("Property tour"), email("Contact me", "Property enquiry"), social("instagram", "facebook", "linkedin")],
  },
  // Food and drink
  {
    id: "cafe", name: "Cafe and restaurant", line: "Menu, bookings and directions", group: "food", tags: ["coffee shop", "restaurant", "bar"],
    appearance: look("paper", "rounded", "solid", "normal", "serif"),
    blocks: [link("See the menu"), link("Book a table"), link("Order for pickup"), link("Find us"), header("From our kitchen"), posts(3), social("instagram", "tiktok", "facebook")],
  },
  {
    id: "foodtruck", name: "Food truck", line: "Where we park today and the menu", group: "food", tags: ["food truck", "street food", "pop-up"],
    appearance: look("capy", "rounded", "hard", "large", "display"),
    blocks: [link("Where we are today"), link("This week's menu"), link("Book us for your event"), header("Fresh off the grill"), posts(6), social("instagram", "tiktok", "facebook")],
  },
  {
    id: "bakery", name: "Bakery", line: "Order cakes, today's bakes and hours", group: "food", tags: ["bakery", "cakes", "patisserie"],
    appearance: look("blush", "pill", "solid", "normal", "rounded"),
    blocks: [link("Order a cake"), link("Today's bakes"), link("Opening hours"), header("Out of the oven"), posts(6), email("Wholesale", "Wholesale enquiry"), social("instagram", "tiktok", "facebook")],
  },
  // Events
  {
    id: "event", name: "Event and launch", line: "Tickets, schedule and venue", group: "events", tags: ["event", "launch", "conference"],
    appearance: look("sunset", "pill", "glass", "large", "display"),
    blocks: [link("Early bird tickets", 14), link("Get tickets"), link("Schedule"), link("Venue and travel"), video("Event trailer"), social("instagram", "linkedin", "x")],
  },
  {
    id: "wedding", name: "Wedding", line: "RSVP, the day and the registry", group: "events", tags: ["wedding", "party", "celebration"],
    appearance: look("peach", "pill", "outline", "normal", "serif"),
    blocks: [link("RSVP"), link("Our day"), link("Travel and stay"), link("Registry"), text("We can't wait to celebrate with you."), header("Our story"), posts(3)],
  },
  {
    id: "nonprofit", name: "Nonprofit", line: "Donate, volunteer and stay in touch", group: "events", tags: ["nonprofit", "charity", "community"],
    appearance: look("sky", "pill", "solid", "normal", "rounded"),
    blocks: [link("Donate"), link("Volunteer"), link("What we do"), link("Join our newsletter"), header("Latest updates"), posts(3), email("Contact us"), social("instagram", "facebook", "linkedin")],
  },
  // Personal
  {
    id: "simple", name: "Simple", line: "Your profiles and a few links", group: "personal", tags: ["anyone"],
    appearance: look("light", "pill"),
    blocks: [social("instagram", "tiktok", "youtube"), link("My website"), link("Latest news"), link("Contact")],
  },
  {
    id: "founder", name: "Founder", line: "What I'm building, writing and reading", group: "personal", tags: ["founder", "ceo", "builder"],
    appearance: look("noir", "rounded", "outline", "normal", "mono"),
    blocks: [link("What I'm building"), link("Read my newsletter"), link("Book office hours"), link("Investors"), text("Building in public. Say hi."), social("x", "linkedin", "github")],
  },
  {
    id: "author", name: "Author and newsletter", line: "Subscribe, read the latest, buy the book", group: "personal", tags: ["author", "writer", "newsletter"],
    appearance: look("paper", "rounded", "outline", "normal", "serif"),
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
  return BIO_TEMPLATES.map((t) => `- ${t.id}: ${t.name}, ${t.line.toLowerCase()} (${t.tags.join(", ")}). Look: ${t.appearance.theme}, ${t.appearance.shape}, ${t.appearance.fill}, ${t.appearance.size}, ${t.appearance.font}. Blocks: ${t.blocks.map(shape).join("; ")}`).join("\n");
}
