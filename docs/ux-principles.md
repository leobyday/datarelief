# UX Principles — DataRelief

> These rules govern every design decision. When you're unsure, come back here first.

## Principles

### 1. Data transparency over polish
Show the freshness date on every crisis figure. A donor making a decision based on stale data is a failure state. Never hide or soften the age of data — label it clearly. A figure from 6 months ago should look different from one updated last week.

**Always:** Show `last updated [date]` adjacent to any funding or people-affected figure.
**Never:** Display crisis metrics without a date, or round "3 months ago" to "recently."

### 2. Every response is a path, not a dead end
Every interaction — whether it's a list of crises, a comparison, or a single data point — must end with a clear, clickable action. The donor came to do something. Never leave them with information and no next step.

**Always:** Include at least one redirect link (via `/api/go/`) in every crisis response.
**Never:** Return a crisis summary with no org links. If no org is verified yet, say so and surface the submission form instead.

### 3. Impact framing, not guilt framing
Donors should feel like smart allocators of limited resources, not like they're choosing who to save. Frame every recommendation around marginal impact: "This crisis is 73% underfunded" not "People are dying."

**Always:** Show the funding gap as a percentage alongside the absolute figure.
**Never:** Use emotional urgency language in MCP responses. Let the data make the case.

---

## Decisions log

| Decision | Why | Date |
|---|---|---|
| Attribution redirect URL instead of direct org link | Every click must be logged; direct links lose the signal permanently | 2026-07-05 |
| Stale data shown with label, not hidden | A donor who acts on bad data is worse than a donor who is warned | 2026-07-05 |
| datarelief.org from day one, API-only (no homepage) | Attribution URLs in Claude responses must be on the final domain — changing them later breaks links already in circulation | 2026-07-05 |
| Admin dashboard password from env, not hardcoded | Client-side password check is MVP-only; source-visible password is a liability | 2026-07-05 |
| No donation amount recommendations | DataRelief surfaces the gap; prescribing amounts would reduce trust | 2026-07-05 |

## Constraints
- MCP responses are read inside Claude Desktop — no custom CSS, no images, only markdown text and links
- Attribution logging must be server-side; Claude Desktop exposes no client analytics
- Crisis data is manually curated (V1) — every field that can't be verified should be omitted, not guessed
