/**
 * Reproduces the reported 500 against the REAL renderer.
 *
 * Fixture is the actual sourceJson the app stored for the failing request
 * (diagram cmupde9zo004xijiiy7rhf8gh), so this asserts on the exact input that
 * produced "Sublabel ... needs ~123px ... provides 116px".
 *
 * Run: npx tsx scripts/check-archify-sizing.ts
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import {
  normalizeComponentSizes,
  requiredComponentWidth,
  textUnits,
} from "../lib/visualization/component-sizing";

interface FixtureComponent {
  id: string;
  label?: string;
  sublabel?: string;
  size?: [number, number];
}
interface Fixture {
  components?: FixtureComponent[];
  layout?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

const RENDERER = join(
  process.env.HOME || "",
  ".agents/skills/archify/renderers/architecture/render-architecture.mjs"
);

// Default fixture is the real diagram that produced the reported 500.
const fixturePath =
  process.argv[2] ??
  join(import.meta.dirname, "fixtures", "archify-oversized-sublabels.json");

// --- unit assertions: mirror the renderer's own arithmetic ------------------
const cases: Array<[string, string, number]> = [
  // [label, sublabel, width the renderer must have been given]
  ["State & Hooks", "useState, useEffect, data fetching", 124],
  ["PostgreSQL", "Migrations, transactions, performance", 120],
  ["Prisma", "Models, service layer, transactions", 120],
];
for (const [label, sublabel, oldWidth] of cases) {
  const need = textUnits(sublabel) * 6 * 0.6;
  const availableOld = oldWidth - 8;
  const fixed = requiredComponentWidth({ label, sublabel });
  const availableNew = fixed - 8;
  const ok = need <= availableNew;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${sublabel.padEnd(34)} needs ~${Math.ceil(need)}px  ` +
      `was ${availableOld}px -> now ${availableNew}px (width ${fixed})`
  );
  if (!ok) process.exitCode = 1;
}

// textUnits must agree with the renderer on the cases that produced the error
if (textUnits("useState, useEffect, data fetching") !== 34) {
  console.error("FAIL textUnits drifted from the renderer's metric");
  process.exitCode = 1;
} else {
  console.log("ok   textUnits matches renderer metric (34 units)");
}

// --- integration: preprocess the real fixture, then run the real renderer ----
const diagram = JSON.parse(readFileSync(fixturePath, "utf8")) as Fixture;
diagram.meta = { ...diagram.meta, output: "architecture.html" };

const work = mkdtempSync(join(tmpdir(), "archify-check-"));
const inPath = join(work, "input.json");
const outPath = join(work, "out.html");

function runRenderer(json: unknown) {
  writeFileSync(inPath, JSON.stringify(json, null, 2));
  return spawnSync("node", [RENDERER, inPath, outPath], {
    cwd: join(process.env.HOME || "", ".agents/skills/archify"),
    encoding: "utf8",
  });
}

// --- the bug must still be caught by the OLD label-only sizing --------------
// Guards against this check passing vacuously: if the fixture ever stops
// reproducing the reported failure, the regression it covers has moved.
const oldWay: Fixture = JSON.parse(JSON.stringify(diagram));
for (const c of oldWay.components ?? []) {
  c.size = [Math.min(180, Math.max(120, (c.label || "").length * 8 + 20)), 50];
}
const oldRes = runRenderer(oldWay);
if (oldRes.status === 0) {
  process.exitCode = 1;
  console.error("FAIL fixture no longer reproduces the reported failure — update this check");
} else {
  const named = /but component "(\w+)"/.exec(oldRes.stderr || "");
  console.log(
    `ok   old label-only sizing still fails (exit ${oldRes.status})${named ? ` on "${named[1]}"` : ""}`
  );
}

// --- the fix must make the real renderer succeed ---------------------------
normalizeComponentSizes(diagram);
const res = runRenderer(diagram);
const html = res.status === 0 ? readFileSync(outPath, "utf8") : "";

if (res.status === 0 && html.includes("</html>")) {
  console.log(`ok   renderer exited 0, produced ${html.length} bytes of HTML`);
  console.log(
    `     widths: ${(diagram.components ?? []).map((c) => `${c.id}=${c.size?.[0]}`).join(" ")}`
  );
} else {
  process.exitCode = 1;
  console.error(`FAIL renderer exited ${res.status}`);
  console.error((res.stderr || "").split("\n").slice(0, 12).join("\n"));
}

// --- a width the model chose must never be shrunk --------------------------
const wide = { label: "Short", sublabel: "tiny", size: [400, 60] };
normalizeComponentSizes({ components: [wide] });
if (wide.size[0] === 400) {
  console.log("ok   a model-supplied width of 400 is preserved, not shrunk");
} else {
  process.exitCode = 1;
  console.error(`FAIL model width shrunk: 400 -> ${wide.size[0]}`);
}