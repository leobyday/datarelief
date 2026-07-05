# Product Requirements — DataRelief

> **What this file is:** The single source of truth for what we're building and why.

## Problem

Donors give reactively — they respond to the crisis with the most media coverage, not the crisis most in need. Syria gets its 100th donation campaign while Venezuela's earthquake goes underfunded. There is no systematic way for a donor to know where their dollar will have the highest marginal impact.

DataRelief solves this by identifying where help is needed most and least available, then connecting donors to the highest-impact opportunities.

## Goal

Help a potential donor find a crisis that needs immediate funds, understand why it's urgent, and reach a verified donation path — in a single Claude conversation.

## Scope

### In scope (V1)
- MCP server installed on gomezcollective.com and usable from Claude Desktop
- Crisis data JSON (`data/crises.json`) covering active global crises with urgency scores and funding gaps
- MCP tool responses that surface ranked crises with context (funding gap, people affected, verified orgs)
- Attribution redirect endpoint (`/api/go/[crisis]/[org]`) that logs every click before sending the user to a donation page
- Server-side logging of every MCP tool call (query received + crisis links returned)
- Admin dashboard (`admin.html`) for reviewing form submissions — read-only for V1
- Form submission endpoint (`POST /api/submit`) that stores to Vercel KV and notifies Discord

### Out of scope (V1 → V2)
- Standalone datarelief.org domain and public website
- Full admin approve/reject backend with GitHub PR automation
- Email notifications (SendGrid/Mailgun)
- Attribution analytics dashboard (UI for viewing logged clicks)
- Auto-approval workflow for trusted organizations
- Real-time API feeds (ReliefWeb, GlobalGiving integration)
- Mobile app

## Requirements

### Functional
| # | Requirement | Priority |
|---|---|---|
| F1 | MCP server responds to natural language crisis queries and returns ranked crisis data | Must |
| F2 | Every MCP response that includes an org link uses the `/api/go/[crisis]/[org]` redirect URL, never a direct org URL | Must |
| F3 | Attribution redirect endpoint logs timestamp, crisis ID, org slug, and source (`claude-mcp`) before redirecting | Must |
| F4 | MCP server logs every tool invocation server-side (query + crises returned) | Must |
| F5 | Crisis data includes: name, country, people affected, funding gap, funding received, urgency score, verified orgs with donation URLs | Must |
| F6 | Every crisis response includes the data's last-updated date | Must |
| F7 | Form submission (`/api/submit`) stores to Vercel KV and sends Discord notification | Must |
| F8 | Admin dashboard shows pending submissions with status badges | Must |
| F9 | MCP supports comparison queries (e.g. "compare Sudan and Afghanistan") | Should |
| F10 | MCP supports filter queries (e.g. "show medical emergencies", "most underfunded") | Should |

### Non-functional
| # | Requirement |
|---|---|
| N1 | `.env` is never committed — all secrets live in Vercel environment variables |
| N2 | Admin dashboard requires password auth; password sourced from environment, not hardcoded in source |
| N3 | Attribution data is the primary analytics signal — no click must be lost |
| N4 | MCP responses must be readable in Claude Desktop without requiring the user to open a browser |
| N5 | Crisis data must include a `lastUpdated` field; stale data is surfaced with a clear label, not hidden |

## Attribution analytics — how it works

Claude Desktop doesn't expose analytics. The MCP server is the measurement layer:

```
User asks: "Who needs help in the world?"
    ↓
MCP logs: { query, timestamp, sessionId }
    ↓
MCP returns crisis data + redirect URLs
    ↓
User clicks: datarelief.org/api/go/sudan-2024/save-the-children
    ↓
Redirect endpoint logs: { crisis, org, source: "claude-mcp", timestamp, userAgent }
    ↓
User lands on Save the Children donation page
```

Two signals: (1) MCP queries served, (2) redirect clicks. Together they show query → conversion rate.

## Open questions
- Should the MCP server log to Vercel KV or a separate logging sink?
- Who approves crisis data submissions in V1 — manually via Discord + crises.json edit?

## Decisions
| Decision | Rationale | Date |
|---|---|---|
| datarelief.org for V1, API-only | Attribution redirect URLs need to be on the final domain — changing them later breaks any links already in circulation. No homepage required; Vercel serves just the API routes and admin.html. | 2026-07-05 |
