---
name: SDE Command Center
description: A soft, glassy workspace — frosted cards on a calm atmosphere with an iris accent. Dark is the default; light is an opt-in stored per user.
colors:
  ink-ground: "#eef1f6"
  ink-raised: "#f5f8fc"
  ink-panel: "#ffffff"
  hairline: "#e5eaf2"
  hairline-strong: "#d5dce8"
  bone: "#23293a"
  bone-muted: "#57607a"
  bone-faint: "#8b93a8"
  paper: "#ffffff"
  paper-shade: "#f2f5fa"
  graphite: "#20263a"
  graphite-muted: "#535d78"
  graphite-faint: "#7d869c"
  highlighter-amber: "#6e6ded"
  amber-light: "#9a99f5"
  amber-ink: "#5452d6"
  stamp-red: "#d9537a"
  stamp-on-ink: "#e46f93"
  valid-green: "#1f9d6a"
  valid-on-ink: "#34c48c"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.1em"
  data:
    fontFamily: "Roboto Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "2px"
  sheet: "3px"
  bubble: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.9rem"
  button-primary-hover:
    backgroundColor: "#171308"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.9rem"
  button-on-ink:
    backgroundColor: "{colors.highlighter-amber}"
    textColor: "#1b1405"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.9rem"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.1rem"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.85rem 0.65rem"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.sheet}"
    padding: "1.75rem 2rem"
---

# Design System: SDE Command Center

## Overview

**Creative North Star: "The Lamp-Lit Response Sheet"**

The product is a person at a desk after dark, filling in an OMR practice booklet by lamp light. The room recedes into ink; the page in front of them is warm, ruled, and finite. Every screen is a sheet of paper on that desk, and every record is a line on the sheet: a numbered row, a bubble to fill, a printed section header with a rule under it, a margin note in graphite.

The system is deliberately un-digital. It rejects the conventions of the growth-dashboard: no gradients, no glass, no soft corner radii, no colored side borders, no accent eyebrow above every heading. Hierarchy comes from print grammar — masthead, numbered sections, hairlines, highlighter marks, rubber stamps — not from elevation and glow. State changes are committed like ink: a bubble fills instantly, a highlighter swipe crosses the row once, and the page stays still.

Both registers are legible and warm. The dark room (`#0a0c10`) carries the chrome, navigation, and empty space; the paper sheet (`#ece0c6`) carries the work. Nothing is pure black or pure white, and nothing is cool or corporate.

**Key Characteristics:**

- Two materials only: ink room and paper sheet.
- Hairline rules and printed section headers, never cards floating on a gradient.
- A single highlighter accent (`#d99a2b`) plus two stamps (red, green).
- Archivo for voice, Roboto Mono for data.
- Motion is reserved for marking a line done; everything else is instant.

## Colors

A warm two-material palette: an ink room, a cream page, one highlighter, two stamps.

### Primary

- **Highlighter Amber** (`#d99a2b`): the one accent. Marks active navigation, the current cadence bar, the "Next up" tag, focus rings, text selection, and the caret. On paper, use its dark sibling so it stays readable.

### Secondary

- **Amber Ink** (`#7c500d`): the readable form of the accent on paper — section indices, active-tab underline, progress ramp terminus, links.
- **Stamp Red** (`#a83226`, on-ink `#e06a5a`): errors, alerts, and the "Note" stamp. Reserved for something wrong or urgent.
- **Valid Green** (`#2f6b4f`, on-ink `#6fbf94`): success notes and completed milestones.

### Neutral

- **Ink Ground** (`#0a0c10`): the room. Page background.
- **Ink Raised** (`#10141b`) / **Ink Panel** (`#161c25`): nav hover and the active nav item.
- **Hairline** (`#232a35`) / **Hairline Strong** (`#333c49`): rules and borders on ink.
- **Bone** (`#ded7c7`): primary text on ink. **Bone Muted** (`#a9a190`) secondary, **Bone Faint** (`#8b8370`) tertiary.
- **Paper** (`#ece0c6`): the sheet. **Paper Shade** (`#e0d2b0`) for pressed/faint fills.
- **Graphite** (`#292317`): primary text on paper. **Graphite Muted** (`#5f5540`) secondary, **Graphite Faint** (`#6b6047`) tertiary.

### Named Rules

**The One Register Rule.** Text is bone on ink or graphite on paper. Never invert a single word inside a sentence for emphasis — use weight, not color.

**The Rationed Highlighter Rule.** The highlighter is the highest-value ink on the page. It appears on the current item, the current day, and the mark of completion. If two things on a screen both want it, one of them is wrong.

## Typography

**Display / Body Font:** Archivo (with `ui-sans-serif`, `system-ui`, `sans-serif`)
**Data / Mono Font:** Roboto Mono (with `ui-monospace`, `monospace`)

**Character:** One grotesque does all the speaking — headings, labels, body — which keeps the page reading as printed matter rather than a designed app. Roboto Mono is held back for numbers and metadata (counts, minutes, dates, identifiers), so the figures line up and read as form data.

### Hierarchy

- **Display** (700, 1.9rem, line-height 1, -0.015em): sheet mastheads only — "Today's response sheet", "Tasks", "Settings", "Sign in".
- **Headline** (600, 1.05rem, line-height 1.2): numbered section titles and milestone names.
- **Title** (600, 0.95rem): card and note headings.
- **Body** (400, 0.875rem, line-height 1.5): everything read at length, max ~68ch.
- **Label** (600, 0.68rem, 0.1em, uppercase): printed field labels and section indices. Short labels only — never a sentence.
- **Data** (400, 0.72rem, tabular): all figures, times, breadcrumbs, and identifiers.

### Named Rules

**The Tabular Figures Rule.** Any number that appears in a column, a count, or a progress readout uses Roboto Mono with tabular numerals. Proportional figures in a table are a defect.

**The Label-Not-Eyebrow Rule.** Uppercase tracked labels belong to form fields and section indices, sitting beside or above their own value. A tracked accent line above a heading, used as decoration, is prohibited.

## Layout

A left spine holds the section index; the work sits on a single centered sheet. On `lg` and up the spine is a 16rem fixed column with the account block pinned to its foot and the sheet floating in the remaining space (max ~1120px, ~880px for settings). Below `lg` the spine collapses to a scrollable top index and the account block moves to the page foot.

Inside a sheet, the rhythm is print: a masthead closed by a 2px rule, a ruled summary strip, numbered sections separated by hairlines, and a two-column margin at the foot for analysis. Vertical gaps step 4 / 8 / 16 / 24 / 40px; sections sit 32–40px apart. Rows are ~2.75rem tall so ruled lines stay even.

## Elevation & Depth

**Flat ink, lit paper.** There is one elevation event in the entire system: a sheet lifted off the ink. The sheet carries an inset top highlight, an inset bottom shade, and one offset shadow (`0 26px 60px -30px rgba(0,0,0,0.95)`) — always with an offset and a blur, never a zero-offset halo. Everything else is flat: rows, rules, stamps, and buttons have no shadow, and depth is communicated by the ink/paper material change, not by stacking.

A single static warm radial (`rgba(217,154,43,0.09)`) anchors the top of the viewport as the lamp; it is atmosphere, fixed, and never animated.

## Shapes

The form language is cut paper: square corners with a 2–3px softening (`rounded-sm`/`rounded-sheet`). There are no 12–24px card radii and no pill cards. Circles appear in exactly one place — the OMR bubble control (`999px`) — where a filled circle is the recorded mark. Rules are 1px hairlines, doubled to 2px only for mastheads and section breaks. Dashed borders (1px) mark empty states.

## Components

### Buttons

- **Shape:** 2px radius, no border, 0.55rem × 0.9rem padding, 0.875rem semibold.
- **Primary (`btn-mark`):** graphite on paper, or amber on ink (`.btn-mark-on-ink`). Active state scales to 0.97; no lift.
- **Secondary (`btn-line`):** transparent with a 1.5px inset graphite outline at 40%, solidifying to 100% on hover. On ink, `btn-line-ink` uses a hairline-strong outline and brightens the text.

### Chips / Stamps

- **Stamp:** 1px currentColor outline, 1px radius, mono 0.625rem uppercase at 0.08em. Amber Ink for "Next up", Stamp Red for "Note" and priorities requiring attention, Valid Green for "Done", Graphite Muted for everything else.

### Cards / Containers

- **Sheet:** the only container. Paper background with a subtle top-light vertical wash, 3px radius, the offset shadow above. All content lives on one sheet per screen; sections inside it are separated by rules, never by nested cards.
- **Note:** a bordered block (`1px` graphite at 40%) for the "Next best move" annotation — flat, no radius, no shadow.

### Inputs / Fields

- **Style:** `.field` — transparent background, no box, a 1.5px bottom rule at 30% graphite, 0.1rem inline padding. On ink, `.field-ink` uses the hairline-strong rule and bone text.
- **Focus:** the bottom rule becomes Amber Ink (paper) or Highlighter Amber (ink) at 1.5px, with no glow and no outline.
- **Disabled:** 50% opacity. Placeholders sit in the faint tertiary color.

### Navigation

- **Style:** numbered index (`01`–`06`) in mono, label in Archivo. Default bone-muted; hover raises to bone with an ink-raised fill; active is ink-panel with bone text, an amber index, and a 1.5px amber dot. Mobile shows the same list as a horizontal scroll strip; the account email and log-out move to the page foot.

### Tabs

- **Style:** `.tab` — graphite-muted label at 0.875rem semibold, 3px Amber Ink underline inset from the edges when selected, sitting on the sheet's 2px masthead rule. No pill backgrounds.

### Bubble (signature)

- **Unfilled:** 1.15rem circle, 1.5px graphite at 45% outline. Hover solidifies the outline.
- **Filled:** solid graphite with a small paper dot, committing instantly (no crossfade) and emitting one amber afterglow ring over ~460ms. Busy shows a pulsing amber dot inside. Disabled (locked milestone) drops to 45% and stops responding.
- **Companion:** a `.hl` highlighter swipe scales in from the left behind the row (transform only, `multiply` blend) when a line is marked done.

## Do's and Don'ts

- **Do** keep one sheet per screen and separate sections with hairlines and numbered headers.
- **Do** route every figure, count, date, and identifier through Roboto Mono with tabular numerals.
- **Do** commit state changes instantly and reserve motion for the mark of completion and the highlighter swipe.
- **Do** theme browser surfaces: amber selection, amber caret, amber focus ring, thin ink scrollbars, olive underlines with offset.
- **Don't** use gradients, glass, backdrop blur, or colored glows as decoration.
- **Don't** use `rounded-xl`/`rounded-2xl` cards, pill buttons, or shadows without an offset and blur.
- **Don't** put a tracked accent eyebrow above a heading.
- **Don't** use colored left borders to signal state — use a stamp, a rule, or a filled bubble.
- **Don't** mix a cool gray, cyan, or violet accent into the warm ink-and-paper palette.
