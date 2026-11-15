import type { MotionProps, Scene } from "../lib/capy/motionRules";

const blank: Omit<Scene, "kind" | "seconds"> = { kicker: "", headline: "", sub: "", value: 0, prefix: "", suffix: "", decimals: 0, items: [], values: [], right: [], leftLabel: "", rightLabel: "", name: "", button: "" };

/** A sample plan for Remotion Studio and the tests (made-up brand and numbers). */
export const SAMPLE: MotionProps = {
  aspect: "9:16",
  brandName: "Ledgerly",
  handle: "ledgerly.com",
  logo: null,
  photo: null,
  colors: { bg: "#0E1A2B", surface: "#16263D", ink: "#F3F6FA", muted: "#9FB0C6", line: "#26384F", accent: "#3DDC97", accentInk: "#06281A", accent2: "#6EA8FE", accentText: "#3DDC97" },
  fonts: { head: "Space Grotesk", headFile: "space-grotesk", headWeight: 700, headLs: "-0.03em", body: "Inter", bodyFile: "inter", bodyWeights: [400, 500, 700] },
  radius: 18,
  scenes: [
    { ...blank, kind: "title", seconds: 3, kicker: "Small business survey", headline: "Cash flow is the new to-do list", sub: "What 2,400 owners told us" },
    { ...blank, kind: "stat", seconds: 3.5, kicker: "Every week", value: 73, suffix: "%", headline: "of owners check their cash flow", sub: "Source: [your source]" },
    { ...blank, kind: "bars", seconds: 4.5, headline: "When they check", items: ["Monday", "Wednesday", "Friday", "Sunday"], values: [41, 18, 29, 12] },
    { ...blank, kind: "list", seconds: 4.5, headline: "Do it in 10 minutes", items: ["Open the bank feed", "Match this week's invoices", "Chase anything late"] },
    { ...blank, kind: "compare", seconds: 5, headline: "Spreadsheet vs Ledgerly", leftLabel: "By hand", items: ["2 hours a week", "Missed invoices"], rightLabel: "Ledgerly", right: ["10 minutes", "Reminders sent for you"] },
    { ...blank, kind: "quote", seconds: 4.5, headline: "I finally know what's coming in before Friday.", name: "Sam Okafor, studio owner" },
    { ...blank, kind: "cta", seconds: 3, headline: "Try it free for 30 days", button: "Start free", sub: "ledgerly.com" },
  ],
};
