# Contextly Landing Page — Section-by-Section Build Prompts

Consistent design system across all prompts below, so sections feel like one product:

**Colors:** Background `#0A0B0F` (near-black), surface `#12141C`, text white / `rgba(255,255,255,0.7)` for secondary, accent signal green `#34FFB3`, secondary accent muted violet `#7C8CFF`, borders `rgba(255,255,255,0.08)`.
**Fonts:** Inter (400, 500, 600, 700) for all UI text, JetBrains Mono (400, 500) for anything code/CLI-flavored — command examples, tags, the `.contextly/` file references.
**Stack:** React + Vite, Framer Motion (`motion` package) for animation, plain CSS (no Tailwind), `lucide-react` for icons.
**Motion language:** Everything eases with `cubic-bezier(0.16, 1, 0.3, 1)`, subtle fade+slide-up entrances (`y: 16-24px` to `0`), staggered by 0.1-0.15s per child. Nothing bouncy or playful — this is a dev-tool, not a consumer app.

Paste each section below into your builder one at a time.

---

## 1. Hero Section

```
Create a full-viewport hero section for "Contextly," a dev tool that gives AI coding agents (Claude Code, Cursor, Copilot) persistent, always-current project memory. React + Vite, Framer Motion, plain CSS, dark technical aesthetic.

Background: #0A0B0F solid, with a subtle animated grid pattern (1px lines, rgba(255,255,255,0.04)) covering the full viewport, plus a soft radial glow in signal green (#34FFB3, low opacity, ~15%) positioned behind the headline, blurred 80px.

Navbar (fixed top, z-index 50):
- Left: wordmark "Contextly" in Inter 600, 18px, white, paired with a small geometric mark (simple, angular, suggesting a relay/handoff — two overlapping arcs or an open bracket shape) in signal green
- Right: single nav item "Docs" (if public) and a "Join Waitlist" pill button — signal green background, black text, 14px weight 600, padding 10px 20px, border-radius 999px, subtle scale-up on hover (1.03)

Hero content (centered, max-width 720px):
- Eyebrow tag above headline: small pill, background rgba(52,255,179,0.1), text "For developers running multiple AI agents" in signal green, 12px, JetBrains Mono, padding 6px 14px, border-radius 999px
- Headline: "Stop re-explaining your project to every AI agent." Inter 700, clamp(2.5rem, 6vw, 4rem), white, line-height 1.1, letter-spacing -0.02em, center-aligned
- Subheadline below: "Contextly keeps a living, always-current brief of your project's architecture and decisions — so Claude Code, Cursor, or whatever's next can pick up exactly where you left off." Inter 400, 18px, rgba(255,255,255,0.65), max-width 560px, centered
- Primary CTA: email input field + "Join the waitlist" button, side by side pill shape, dark surface background (#12141C), border rgba(255,255,255,0.1), input text white placeholder "you@email.com", button signal green fill
- Micro-copy under form: "One email when we launch. No spam." 13px, rgba(255,255,255,0.4)

Below the fold hint: a simple terminal-style code block mockup showing:
```
$ npx contextly init
✓ scanned 84 files, detected Next.js + Supabase
✓ mcp server connected — claude code, cursor
```
Styled as a dark rounded card, JetBrains Mono 13px, signal green for the ✓ checkmarks, subtle border glow.

Animation: navbar slides down (y:-16 to 0, opacity 0 to 1, 0.6s). Eyebrow tag fades up first (delay 0.1s), headline next (delay 0.25s), subheadline (delay 0.4s), form (delay 0.55s), terminal mockup (delay 0.7s, slight scale-in from 0.96 to 1).

Responsive: stack navbar items on mobile, headline drops to clamp(2rem, 8vw, 2.5rem), terminal mockup shrinks font to 11px.
```

---

## 2. The Problem Section

```
Create a three-column "problem" section for the Contextly landing page, following directly after the hero. React + Vite, Framer Motion, dark theme (#0A0B0F background, matches hero).

Section header (centered, max-width 600px):
- Small eyebrow: "The problem" in signal green (#34FFB3), JetBrains Mono, 12px, uppercase, letter-spacing 0.05em
- Heading: "Every new AI session starts from zero." Inter 600, clamp(1.75rem, 4vw, 2.5rem), white, centered

Three cards in a row (stack on mobile), each: background #12141C, border rgba(255,255,255,0.08), border-radius 16px, padding 32px, equal height.

Card 1:
- Icon (lucide-react): RotateCcw, 24px, signal green
- Title: "Hit a limit, lose the thread" Inter 600, 17px, white
- Body: "You hit a usage cap mid-task, switch tools, and have to re-explain your entire architecture from scratch." Inter 400, 14px, rgba(255,255,255,0.6)

Card 2:
- Icon: FileX, 24px, muted violet (#7C8CFF)
- Title: "Docs go stale in days" Inter 600, 17px, white
- Body: "A README you write once is out of date by the next sprint — nobody keeps it maintained." Inter 400, 14px, rgba(255,255,255,0.6)

Card 3:
- Icon: Users, 24px, signal green
- Title: "Every tool sees something different" Inter 600, 17px, white
- Body: "Your team uses Claude Code, Cursor, Copilot — each with its own picture of the codebase, so output stays inconsistent." Inter 400, 14px, rgba(255,255,255,0.6)

Animation: cards fade up in sequence (y: 24 to 0, opacity 0 to 1), staggered 0.15s apart, triggered on scroll into view (use Framer Motion's `whileInView`, `viewport={{ once: true }}`).

Responsive: single column stack under 768px, cards full width with 16px gap.
```

---

## 3. How It Works Section

```
Create a 4-step "how it works" section for Contextly, following the problem section. React + Vite, Framer Motion, same dark theme.

Section header (centered):
- Eyebrow: "How it works" signal green, JetBrains Mono, 12px, uppercase
- Heading: "One command. Every agent stays current." Inter 600, clamp(1.75rem, 4vw, 2.5rem), white

Horizontal step layout (vertical stack on mobile), 4 steps connected by a thin dashed line (rgba(255,255,255,0.15)) running behind the step markers:

Step 1: number badge "01" (circle, border signal green, transparent fill, Inter 600 14px green text) — Title "Run one command" — Body "npx contextly init scans your repo and sets up everything automatically."
Step 2: "02" — Title "It watches quietly" — Body "Git commits and merged PRs get captured in the background — no manual docs to maintain."
Step 3: "03" — Title "Any agent connects" — Body "Claude Code, Cursor, or whatever you use next reads from the same live brief via MCP."
Step 4: "04" — Title "Switch freely" — Body "Change tools, change machines, come back after a week — the context is exactly where you left it."

Below the 4 steps, a code snippet card (same terminal style as hero) showing a realistic agent query exchange:
```
agent> get_context("authentication")
contextly> Using Supabase Auth with GitHub OAuth.
           Switched from custom JWT on Mar 3 —
           see decision #14 for reasoning.
```
Dark card, JetBrains Mono 13px, signal green for the `agent>`/`contextly>` prompts, white for response text.

Animation: steps reveal left-to-right (desktop) or top-to-bottom (mobile) on scroll, each fading up with 0.12s stagger. The dashed connecting line animates its stroke-dashoffset from full to 0 as steps appear (simple SVG line, not Framer-dependent).

Responsive: steps stack vertically under 768px, connecting line becomes vertical.
```

---

## 4. Objection-Handling Section ("Why not just ask AI to write a doc?")

```
Create a single-focus objection-handling section for Contextly — addressing "why not just ask AI to write a summary doc?" React + Vite, Framer Motion, dark theme, centered layout, max-width 700px.

Layout: centered card, background #12141C, border rgba(255,255,255,0.08), border-radius 20px, padding 48px, subtle drop shadow.

Content:
- Small label: "The obvious question" rgba(255,255,255,0.5), 13px, Inter 500
- Large quoted question, styled as if asked by a skeptical user: "Can't I just ask my AI to write a summary doc?" Inter 500, 22px, white, italic, quote-mark styling (large decorative " character in signal green, positioned top-left of the text, low opacity)
- Answer below, Inter 400, 16px, rgba(255,255,255,0.7), line-height 1.6: "Sure — now keep that doc perfectly in sync, forever, across every tool, without ever opening it yourself."
- Three small inline comparison rows below, each with an X icon (red-tinted, muted) for "a doc" and a check icon (signal green) for "Contextly":
  - "Goes stale within days" (doc) vs "Auto-captured from every commit" (Contextly)
  - "Has to be read in full" (doc) vs "Answers targeted questions directly" (Contextly)
  - "Locked to whoever wrote it" (doc) vs "Works across every AI agent automatically" (Contextly)
  Each row: two-column grid, icon + text pairs, 14px Inter, rgba(255,255,255,0.55) for the "doc" side, white for the "Contextly" side.

Animation: card scales in slightly (0.96 to 1) with fade, on scroll into view. Comparison rows stagger in afterward, 0.1s apart.

Responsive: card padding drops to 24px on mobile, comparison rows stack to single column (icon+text pairs full width, doc row above Contextly row for each comparison).
```

---

## 5. Built For / ICP Section

```
Create a "who this is for" section for Contextly. React + Vite, Framer Motion, dark theme, three-card layout matching the visual weight of the earlier problem section but with a lighter, more inviting tone.

Section header (centered):
- Eyebrow: "Built for" signal green, JetBrains Mono, 12px uppercase
- Heading: "If you juggle more than one AI tool, this is for you." Inter 600, clamp(1.75rem, 4vw, 2.25rem), white

Three cards, side by side (stack on mobile), background #12141C, border rgba(255,255,255,0.08), border-radius 16px, padding 28px:

Card 1: Icon Briefcase (lucide), signal green. Title "Freelancers & agencies" Inter 600 16px white. Body "Juggling multiple client codebases without losing track of what you decided and why." 14px rgba(255,255,255,0.6)

Card 2: Icon Users2, muted violet. Title "Small-mid dev teams" white. Body "Using more than one AI coding tool and tired of inconsistent output between them." 14px

Card 3: Icon Zap, signal green. Title "Hackathon teams" white. Body "Need fast onboarding across multiple devs in a very short window." 14px

Animation: identical stagger pattern to the problem section cards — fade up, 0.15s apart, whileInView triggered.

Responsive: single column under 768px.
```

---

## 6. CLI-First Section

```
Create a section for Contextly emphasizing its CLI-first design — this should feel distinctly different from a typical SaaS dashboard pitch section. React + Vite, Framer Motion, dark theme.

Layout: two-column (image/mockup left, text right on desktop; stacked on mobile, text first).

Left: a large terminal window mockup — dark card (#0D0E13), rounded 12px corners, macOS-style traffic light dots (small, muted, top-left), containing a realistic scrolling command sequence in JetBrains Mono 13px:
```
$ npx contextly init
$ contextly login
$ git commit -m "switch auth --context"
$ contextly sync
```
Each line types in sequentially (simple typewriter effect, 30ms/char, one line at a time with small pause between).

Right column:
- Eyebrow: "Built for the terminal" signal green, JetBrains Mono, 12px uppercase
- Heading: "Everything that matters happens without opening a browser." Inter 600, clamp(1.5rem, 3.5vw, 2rem), white
- Body: "Setup, syncing, logging decisions, connecting agents — all CLI. The dashboard exists for the few things a terminal genuinely does worse: managing team access, billing, and exporting context." Inter 400, 16px, rgba(255,255,255,0.65), line-height 1.6
- Small list below (checkmarks, signal green): "One command to set up" / "No dashboard required for daily use" / "Works exactly where you already are"

Animation: terminal mockup fades in with slight scale (0.95 to 1), text column fades up with 0.2s delay relative to terminal, list items stagger in last.

Responsive: reverse to single column stacked (text above terminal) under 768px, terminal font drops to 11px.
```

---

## 7. Waitlist Form Section (standalone, can also double as a repeated CTA near the footer)

```
Create a focused waitlist capture section for Contextly, intended to sit near the bottom of the page as a final call-to-action before the footer. React + Vite, Framer Motion, dark theme, centered, high visual weight (this is a conversion moment).

Layout: centered content, max-width 560px, generous vertical padding (120px top/bottom desktop, 64px mobile). Background: same #0A0B0F but with a large soft signal-green radial glow behind the content (low opacity ~10%, blurred 100px), similar to the hero glow but more concentrated.

Content:
- Heading: "Be first to plug your agents in." Inter 600, clamp(1.75rem, 4.5vw, 2.5rem), white, centered
- Subtext: "We're not live yet. Join the waitlist and you'll get one email the moment Contextly is ready." Inter 400, 16px, rgba(255,255,255,0.6), centered, max-width 420px

Form: email input + submit button, stacked on mobile / inline pill on desktop. Input: dark surface #12141C, border rgba(255,255,255,0.12), border-radius 999px (or 12px if inline breaks into two elements), padding 14px 20px, placeholder "you@email.com" in rgba(255,255,255,0.35). Button: signal green background, black text, Inter 600 15px, "Join the waitlist", border-radius matches input, padding 14px 28px, hover scale 1.02.

Success state: on submit, form area cross-fades (0.3s) into a confirmation message: checkmark icon (signal green, 32px) + "You're on the list. We'll email you at [entered email] when it's ready." Inter 500, 16px, white, centered.

Below form: micro-copy "No spam. Unsubscribe anytime." 13px rgba(255,255,255,0.4)

Animation: whole section fades up on scroll into view (y:24 to 0), form success-state transition is a simple crossfade, not a page reload.

Responsive: form goes from inline pill (desktop) to stacked full-width input + full-width button (mobile), heading drops to clamp(1.5rem, 7vw, 2rem).
```

---

## 8. Footer

```
Create a minimal footer for Contextly. React + Vite, Framer Motion (subtle fade-in only, no complex animation needed here), dark theme, border-top rgba(255,255,255,0.08).

Layout: flexbox row (space-between), padding 40px 64px desktop / 32px 24px mobile, max-width 1200px centered.

Left: wordmark "Contextly" Inter 600 15px white, small text below "Living memory for AI coding agents." rgba(255,255,255,0.4) 13px.

Right: horizontal link row (stack on mobile) — "Docs" (if public yet, otherwise omit), "GitHub" (icon + text, lucide Github icon 16px), "Contact" (mailto link). Each link 14px Inter 400, rgba(255,255,255,0.6), hover to white with 0.2s transition, no underline.

Bottom sub-row (full width, thin border-top rgba(255,255,255,0.06), padding-top 20px, margin-top 24px): small copyright text "© 2026 Contextly." rgba(255,255,255,0.3) 12px, left-aligned.

Animation: whole footer fades in on scroll into view, no stagger needed — this is a low-emphasis section.

Responsive: stack left/right blocks vertically on mobile with 24px gap, link row wraps if needed.
```

---

## Notes on Assembly

- **Pricing section is intentionally excluded** — per the landing page plan, pricing isn't finalized and shouldn't be publicly committed to before launch. Don't add a pricing prompt to the live waitlist page; revisit once $10/mo Pro tier is locked and ready to announce.
- Keep the hero's terminal mockup, the "how it works" terminal mockup, and the CLI-first section's terminal mockup visually identical (same card style, same font size, same corner radius) so they read as one consistent motif across the page rather than three different treatments.
- Suggested page order: Hero → Problem → How It Works → Objection-Handling → Built For → CLI-First → Waitlist CTA → Footer.
