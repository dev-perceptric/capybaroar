// The CapyMotion Remotion entry: bundled at build time (scripts/build-motion.mjs) into motion-bundle/, which the server
// renders with @remotion/renderer. Only our own scene kit runs here; Claude's plan arrives as checked props.
import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
