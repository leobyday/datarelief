# DataRelief

## Before you generate anything, read:
- [docs/prd.md](docs/prd.md) — what we're building and why
- [docs/user-flows.md](docs/user-flows.md) — how users move through it
- [docs/ux-principles.md](docs/ux-principles.md) — design decisions and constraints
- [docs/design-system.md](docs/design-system.md) — which tokens and components to use
- [design/tokens.md](design/tokens.md) — exact color, spacing, and type values
- [design/components.md](design/components.md) — component inventory and variant rules
- [design/interaction-patterns.md](design/interaction-patterns.md) — hover, focus, animation rules

## Stack
TypeScript + Node.js MCP server (`@modelcontextprotocol/sdk`) · Static HTML site built via `scripts/generate-sites.js` · Deployed to Vercel · Vercel KV for submission storage · Discord webhooks for admin notifications

## Key files
| File | Purpose |
|---|---|
| `config.ts` | Single source of truth for domain, email, URLs |
| `submit.ts` | Next.js API route — handles POST /api/submit and GET /api/submit?id= |
| `admin.html` | Password-gated admin dashboard (sessions only, MVP) |
| `data/crises.json` | Crisis data — edit this to update what the MCP returns |
| `src/index.ts` | MCP server entry point (to be built) |
| `src/global-crisis.ts` | Data aggregation layer |
| `scripts/generate-sites.js` | Builds static HTML crisis dashboards into `public/` |
| `package-npm.json` | Rename to `package.json` before running npm install |

## V1 vs V2 scope
**V1 (current):** datarelief.org deployed as API-only on Vercel. No public homepage or crisis dashboards — just `/api/go/`, `/api/submit`, and `/admin.html`. MCP server runs as a Node.js process pointed at this domain.
**V2 (future):** Public website, crisis dashboards, full admin approval backend with GitHub PR automation.

## Attribution tracking
Every MCP tool call and every redirect click must be logged server-side. This is the primary analytics signal. See [docs/prd.md](docs/prd.md) for the full requirement and [docs/user-flows.md](docs/user-flows.md) for where logging happens in each flow.

## Hidden features (not yet ready for V1)
> **System rule:** "Hidden" means hidden everywhere — nav links, sitemap.xml, llms.txt, robots.txt, and any footer/internal links.

| Feature | Status | Re-enable when |
|---|---|---|
| Standalone datarelief.org website | Hidden — V2 | Domain purchased + hosting set up |
| Admin approve/reject backend | Stub only | Vercel KV + GitHub PR automation wired |
| Attribution analytics dashboard | Planned | Redirect logging implemented |
| Email notifications (SendGrid) | Optional | Discord webhook insufficient |
| Auto-approval workflow | Future | Org trust system built |

## Never
- Return a crisis link without logging the attribution event
- Show funding numbers without a data-freshness label (date of last update)
- Recommend a specific donation amount — surface the gap, let the user decide
- Hardcode the admin password in source — it must come from environment
