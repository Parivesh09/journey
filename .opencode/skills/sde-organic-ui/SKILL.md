# SDE Command Center — Organic UI System

## Product

SDE Command Center is a personal SDE preparation,
roadmap, accountability and study-session application.

The UI should feel:

- calm
- focused
- editorial
- warm
- premium
- approachable
- highly readable

Avoid:

- generic AI dashboard aesthetics
- excessive gradients
- neon colors
- excessive shadows
- dense layouts
- excessive rounded pills
- excessive animations
- dashboard clutter

## Color system

--background: #F5F5F0
--foreground: #18302C

--primary: #024F46
--primary-foreground: #FFFFFF

--accent: #ECBA82
--accent-foreground: #18302C

--surface: #FFFFFF
--muted: #EAE9E3

--success: ...
--warning: ...
--danger: ...

Use semantic tokens rather than hardcoded colors.

## Typography

Display:
Editorial serif font.

Body:
Inter or equivalent modern sans-serif.

Headings should have strong editorial character.

Body text should remain highly readable.

## Layout

Maximum content width:
1280px.

Use generous whitespace.

Desktop:
sidebar + content.

Mobile:
bottom navigation or collapsible navigation.

## Cards

- white surface
- borderless where possible
- 16px radius
- subtle elevation
- generous internal padding

Avoid cards inside cards unless necessary.

## Buttons

Primary:
deep teal background + white text.

Secondary:
warm neutral surface.

Accent:
warm amber.

Avoid excessive pill-shaped buttons.

## Interaction

Use subtle transitions.

No unnecessary animation.

Focus states must be visible.

Keyboard navigation must work.

Maintain WCAG AA contrast.

## Implementation rules

Never modify:

- API contracts
- database schema
- authentication
- authorization
- business logic
- data ownership
- notification behavior

unless explicitly requested.

Prefer existing components.

Create reusable primitives when a pattern occurs 3+ times.
