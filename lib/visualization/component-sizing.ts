/**
 * Width normalisation for Archify architecture components.
 *
 * The renderer is a strict validator: it rejects any component whose label,
 * sublabel, tag or brand rail cannot fit its box at a legible minimum font, and
 * exits non-zero. Rather than let the model guess, we widen boxes to exactly
 * what the renderer will accept. The metrics below are transcribed from
 * ~/.agents/skills/archify/renderers/shared/{utils,text-fit}.mjs and
 * renderers/architecture/render-architecture.mjs — keep them in sync.
 */

const TEXT_WIDTH_FACTOR = 0.6; // nodeTextFit.widthFactor
const TEXT_PADDING = 8; // nodeTextFit.horizontalPadding
const LABEL_UNITS_PER_PX = 6.6; // render-architecture.mjs estLabelW
const DETAIL_MIN_FONT = 6; // componentTextFit.{sublabel,tag}Minimum
const BRAND_RAIL_RESERVE = 48; // brandTopRailProblem
const BRAND_RAIL_UNITS_PER_PX = 4.8; // brandTopRailProblem at 8px
const MIN_COMPONENT_WIDTH = 120; // renderer layout.defaultW
const DEFAULT_COMPONENT_HEIGHT = 60; // renderer layout.defaultH

const EMOJI_START = 0x1f000;
const EMOJI_END = 0x1faff;
const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;
const FULLWIDTH =
  /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/u;

/** Renderer-equivalent of textUnits(): emoji and fullwidth glyphs count double. */
export function textUnits(text: unknown): number {
  const chars = Array.from(String(text ?? ""));
  let units = 0;
  for (let i = 0; i < chars.length; i += 1) {
    const codePoint = chars[i].codePointAt(0) ?? 0;
    if (codePoint >= VARIATION_SELECTOR_START && codePoint <= VARIATION_SELECTOR_END) continue;
    const next = i + 1 < chars.length ? chars[i + 1].codePointAt(0) ?? -1 : -1;
    if (next >= EMOJI_START && next <= EMOJI_END) units += 2;
    else if (FULLWIDTH.test(chars[i])) units += 2;
    else units += 1;
  }
  return units;
}

/**
 * Narrowest width the renderer will accept, derived from the same three gates
 * it enforces: label, sublabel/tag, and the brand top rail.
 */
export function requiredComponentWidth(comp: Record<string, unknown>): number {
  const labelUnits = textUnits(comp.label);
  let width = MIN_COMPONENT_WIDTH;

  // render-architecture.mjs: label passes when units * 6.6 <= width + 8
  width = Math.max(width, labelUnits * LABEL_UNITS_PER_PX - TEXT_PADDING);

  // render-architecture.mjs: sublabel/tag pass when units * 6 * 0.6 <= width - 8
  for (const field of [comp.sublabel, comp.tag]) {
    if (!field) continue;
    width = Math.max(width, textUnits(field) * DETAIL_MIN_FONT * TEXT_WIDTH_FACTOR + TEXT_PADDING);
  }

  // brand-marks.mjs: a brand mark reserves 48px of the top rail for the label
  if (comp.brand) {
    width = Math.max(width, labelUnits * BRAND_RAIL_UNITS_PER_PX + BRAND_RAIL_RESERVE);
  }

  return Math.ceil(width);
}

/**
 * Widen components to fit their own text, keep grid spacing in step, and drop
 * any declared viewBox so the renderer can derive the canvas from real extents.
 * Mutates and returns `diagram`.
 */
export function normalizeComponentSizes<T extends { components?: unknown; layout?: unknown; meta?: unknown }>(diagram: T): T {
  if (!Array.isArray(diagram.components)) return diagram;

  let maxWidth = 0;
  for (const comp of diagram.components as Record<string, unknown>[]) {
    // Widen only — never shrink a width the model chose deliberately.
    const existing = Array.isArray(comp.size) ? Number(comp.size[0]) : 0;
    const height = Array.isArray(comp.size) ? Number(comp.size[1]) : 0;
    const width = Math.max(existing > 0 ? existing : 0, requiredComponentWidth(comp));
    comp.size = [width, height > 0 ? height : DEFAULT_COMPONENT_HEIGHT];
    if (width > maxWidth) maxWidth = width;
  }

  // Grid spacing is derived from cellW (stepX = cellW + gapX), so it has to
  // track the widest component or widened boxes would collide.
  if (diagram.layout && typeof diagram.layout === "object") {
    const layout = diagram.layout as Record<string, unknown>;
    layout.cellW = Math.max(Number(layout.cellW) || 0, maxWidth);
  }

  // A declared meta.viewBox is used verbatim, so it goes stale the moment we
  // resize a component. Dropping it avoids "falls outside the viewBox".
  if (diagram.meta && typeof diagram.meta === "object") {
    delete (diagram.meta as Record<string, unknown>).viewBox;
  }

  return diagram;
}