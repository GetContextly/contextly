# Landing Page — Content & Info Requirements

Purpose of this doc: everything the getcontextly.dev landing page needs to say, before any visual design happens. Content first, design second — per the design process, copy shouldn't be an afterthought bolted onto a template.

**Status:** waitlist-only. Do not announce publicly until the domain is live and this page is ready.

---

## 1. Hero Section

- **The single job of this page:** get a developer to understand the pain point in one sentence and join the waitlist
- **Headline direction:** lead with the pain, not the feature. Something like the exact moment of frustration — hitting a usage limit mid-task, switching tools, losing all context — rather than "AI-powered project memory" (too abstract, too generic-SaaS)
- **Subheadline:** one sentence on the mechanism — a living project brief any AI agent can read, always current
- **Primary CTA:** waitlist email capture, front and center
- **Secondary CTA (optional):** link to GitHub repo / docs, if public at that point

---

## 2. The Problem (make it visceral, specific to devs)

Cover these three pain points explicitly, each grounded in a relatable moment:
- Hitting a usage limit or context window mid-task, switching to another tool, and losing the thread entirely
- Manually written docs/READMEs going stale within days because nobody keeps them updated
- Teams using multiple AI coding tools getting inconsistent output because each tool has a different picture of the codebase

Avoid generic "AI is powerful but context is hard" framing — ground every point in a specific, recognizable moment a developer has actually lived through.

---

## 3. How It Works

Plain-language walkthrough, not a technical deep-dive (that belongs in docs, not the landing page):
1. Run one CLI command to set up
2. It watches your commits and PRs quietly, capturing decisions as you naturally work
3. Any AI agent you use — Claude Code, Cursor, whatever's next — reads from the same up-to-date brief
4. Switch tools, switch machines, come back after a week — the context is still there

Consider a **live-feeling demo moment** here — even a static, well-designed mockup of an agent querying context and getting a real answer back does more than paragraphs of explanation. Per the design principles: open with the most characteristic thing in the product's world.

---

## 4. Why Not Just Ask the AI to Write a Summary Doc? (objection-handling section)

This is a real question people will ask — answer it directly and confidently rather than avoiding it:
> "Sure — now keep that doc perfectly in sync, forever, across every tool, without ever opening it yourself."

Cover briefly:
- Docs go stale, this doesn't (auto-captured, not manually maintained)
- A doc can't answer targeted questions — this can ("why did we drop approach X?")
- A doc doesn't work across agents automatically — this is agent-agnostic by design

---

## 5. Built For (ICP section)

Speak directly to the actual audience, not a generic "developers" catch-all:
- Freelancers and agencies juggling multiple client codebases
- Small-to-mid dev teams using more than one AI coding tool
- Hackathon teams needing fast onboarding across multiple devs in a short window

---

## 6. CLI-First Messaging

Explicitly call out that this is built for the terminal, not another dashboard to babysit:
- One command to set up
- Everything from initial setup to logging decisions can happen without opening a browser
- The dashboard exists for the things a terminal genuinely does worse — team management, billing, exporting context — not as the primary interface

This matters because it differentiates from "yet another AI SaaS dashboard" positioning and signals directly to the target audience (devs who live in the terminal) that this respects their workflow.

---

## 7. Waitlist Form

- Email field, single clear CTA button ("Join the waitlist" — plain, no cleverness needed here)
- One-line reassurance under the form: what they're signing up for and roughly what to expect (e.g. "One email when we launch. No spam.")
- Confirmation state after submit — clear, in-voice, not a generic "Thank you!"

---

## 8. Footer

- Link to docs (if public)
- Link to GitHub (if public)
- Contact/email
- No pricing page yet — pricing isn't final and shouldn't be publicly committed to before launch

---

## Tone & Voice Notes for Copywriting

- Write from the developer's side of the screen — name things by what they control and recognize, not how the system is built internally (e.g. "your project's memory," not "our vector embedding pipeline")
- Plain verbs, sentence case, no filler — avoid generic SaaS language ("revolutionize," "seamless," "unlock")
- Be specific over clever — a concrete example of the "switching agents mid-task" moment beats an abstract tagline every time
- No pricing details or third-party tool logos until they're actually confirmed/integrated — don't overpromise on the waitlist page
