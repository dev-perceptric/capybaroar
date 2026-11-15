// Bundles the CapyMotion scene kit (src/motion) with Remotion's bundler into motion-bundle/, with our fonts as its
// static files. Runs at build time (npm run build), so nothing is bundled while a video renders.
import { bundle } from "@remotion/bundler";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pub = join(root, ".motion-public");
rmSync(pub, { recursive: true, force: true });
mkdirSync(pub, { recursive: true });
cpSync(join(root, "public", "capy-fonts"), join(pub, "fonts"), { recursive: true });
const out = join(root, "motion-bundle");
rmSync(out, { recursive: true, force: true });
await bundle({ entryPoint: join(root, "src", "motion", "index.ts"), outDir: out, publicDir: pub, enableCaching: false });
rmSync(pub, { recursive: true, force: true });
console.log("motion bundle:", out);
