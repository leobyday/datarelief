# Design Tokens — DataRelief

> Extracted from `admin.html` inline styles. All tokens marked ✅ are in active use.

## Color tokens in use
| Name | Value | Used for |
|---|---|---|
| Page background | `#f3f4f6` ✅ | `body` background |
| Surface | `#ffffff` ✅ | Cards, header, detail boxes |
| Surface inner | `#f9fafb` ✅ | `.submission-item` background |
| Text primary | `#1f2937` ✅ | Headings, body copy, detail values |
| Text secondary | `#6b7280` ✅ | Subtitles, labels, meta |
| Blue accent | `#0066cc` ✅ | Metrics, left border on submissions, filter active, edit button |
| Border | `#e5e7eb` ✅ | Item list dividers, card borders |
| Filter chip | `#e5e7eb` ✅ | Inactive filter buttons |
| Approve green | `#10b981` ✅ | Approve button |
| Reject red | `#ef4444` ✅ | Reject button |

## Status tokens
| Name | Background | Text |
|---|---|---|
| Pending | `#fef3c7` ✅ | `#92400e` ✅ |
| Approved | `#dcfce7` ✅ | `#166534` ✅ |
| Rejected | `#fee2e2` ✅ | `#991b1b` ✅ |

## Priority tokens
| Name | Background | Text |
|---|---|---|
| Critical | `#fee2e2` ✅ | `#991b1b` ✅ |
| High | `#fef3c7` ✅ | `#92400e` ✅ |
| Medium | `#dbeafe` ✅ | `#0c4a6e` ✅ |
| Low | `#dcfce7` ✅ | `#166534` ✅ |

## Overrides (differs from global design system default)
| Name | Value | Replaces | Reason |
|---|---|---|---|
| Font | System stack | Jost | No web font loaded; system fonts load instantly |
| Border radius (cards) | `12px` | `10px` | Slightly more rounded per admin.html |
| Background | `#f3f4f6` | `#0f1623` | Light theme — public-facing utility tool, not portfolio dark theme |

## New tokens (project-specific)
| Name | Value | Used for |
|---|---|---|
| Submission left border | `4px solid #0066cc` | Left border accent on `.submission-item` |
| Card shadow | `0 4px 12px rgba(0,0,0,0.08)` | Elevation for cards and header |
| Metric font size | `2.5rem / 700` | Large KPI numbers in dashboard grid |
