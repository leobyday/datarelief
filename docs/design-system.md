# Design System — DataRelief

> Applies to the admin dashboard and any future web surfaces (submit form, V2 website).
> MCP responses are plain markdown — no design tokens apply there.

## Color tokens
| Token | Value | Used for |
|---|---|---|
| `--bg` | `#f3f4f6` | Page background |
| `--surface` | `#ffffff` | Cards, panels, header |
| `--surface-inner` | `#f9fafb` | Submission items, inner rows |
| `--text-1` | `#1f2937` | Primary text, headings |
| `--text-2` | `#6b7280` | Secondary / meta text, labels |
| `--blue` | `#0066cc` | Primary actions, metrics, left border accent |
| `--border` | `#e5e7eb` | Card borders, dividers |
| `--filter-chip` | `#e5e7eb` | Inactive filter buttons |

## Status colors
| Status | Background | Text |
|---|---|---|
| Pending | `#fef3c7` | `#92400e` |
| Approved | `#dcfce7` | `#166534` |
| Rejected | `#fee2e2` | `#991b1b` |

## Priority colors
| Priority | Background | Text |
|---|---|---|
| Critical | `#fee2e2` | `#991b1b` |
| High | `#fef3c7` | `#92400e` |
| Medium | `#dbeafe` | `#0c4a6e` |
| Low | `#dcfce7` | `#166534` |

## Action colors
| Action | Color |
|---|---|
| Approve | `#10b981` (green) |
| Reject | `#ef4444` (red) |
| Edit / primary | `#0066cc` (blue) |

## Typography
| Use | Font | Size | Weight |
|---|---|---|---|
| Body / UI | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | 14px | 400 |
| Page headings (h1) | Same stack | 24px+ | 700 |
| Section headings (h2) | Same stack | 24px | 600 |
| Submission title | Same stack | 17.6px (1.1rem) | 600 |
| Metric display | Same stack | 40px (2.5rem) | 700 |
| Labels / uppercase meta | Same stack | 13.6px (0.85rem) | 400, letter-spacing 0.05em, uppercase |
| Submission ID | Monospace | 13.6px (0.85rem) | 400 |

## Spacing
`12 · 15 · 20 · 25 · 30px` (card padding: 25–30px, grid gap: 20px, item gap: 15px)

## Border radius
`12px` cards/header · `8px` submission items · `6px` inputs, buttons, inner detail boxes · `20px` status badges/pills · `4px` priority tags

## Shadow
`0 4px 12px rgba(0,0,0,0.08)` — cards and header only

## SEO & GEO metadata
| Tag | Value |
|---|---|
| Title | Admin Dashboard - datarelief.org (admin); to be set for V2 public pages |
| Domain | datarelief.org |
| Contact | contact@datarelief.org |
| Schema @type | Not yet implemented |
| GEO tags | Not yet implemented |

## Analytics
| Service | ID / Key | Events tracked |
|---|---|---|
| MCP server logs | Server-side (Vercel KV or stdout) | Every tool call: query + crises returned |
| Redirect endpoint | `/api/go/[crisis]/[org]` | Every click: crisis, org, source, timestamp |
| GA4 | Not set up | — |
| PostHog | Not set up | — |
