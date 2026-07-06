# Design Tokens — DataRelief

> Two surfaces: **public site** (dark, Figma "Nights and Weekends" node 545:486)
> and **admin dashboard** (light, `admin.html`). Tokens are split by surface.

---

## Public site tokens

### Colors
| Token | Value | Used for |
|---|---|---|
| `--bg` | `#0a0a0a` | Page background, canvas backdrop |
| `--surface-bar` | `#d9d9d9` | MCP URL input bar |
| `--text-primary` | `#fefff4` | Nav links, hover labels |
| `--text-muted` | `#9a9494` | Tagline / subtitle |
| `--text-on-bar` | `#0a0a0a` | URL text inside MCP bar |
| `--dot-color` | `rgba(255,255,255,α)` | Canvas dot grid — alpha varies by position |
| `--border-footer` | `rgba(255,255,255,0.07)` | Footer top border |

### Typography
| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Logo / nav links / footer brand | `Bitcount Grid Single` | 44px / 24px / 14px | 400 | 1.32px / 0.72px |
| Tagline / MCP URL / all body | `Kode Mono` | 18px / 20px | 400–500 | 0.54px / 1.2px |

Both fonts loaded via Google Fonts:
```
https://fonts.googleapis.com/css2?family=Bitcount+Grid+Single&family=Kode+Mono:wght@400;500
```

### MCP bar
| Property | Value |
|---|---|
| Width | `min(551px, 90vw)` |
| Background | `#d9d9d9` |
| Border radius | `4px` |
| Padding | `12px 16px 12px 20px` |

### Dot grid animation
| Property | Value |
|---|---|
| Dot spacing | `18px` |
| Dot shape | Square (`fillRect`) |
| Min dot size | `spacing × 0.06` |
| Max dot size | `spacing × 0.46` |
| Wave 1 frequency | `dist × 0.022`, speed `2.6` |
| Wave 2 frequency | `dist × 0.016`, speed `1.9`, phase offset `2.2` |
| Mouse bloom radius | `90px`, falloff `quadratic` |

---

## Admin dashboard tokens (admin.html — light theme)

### Colors
| Token | Value | Used for |
|---|---|---|
| Page background | `#f3f4f6` | `body` |
| Surface | `#ffffff` | Cards, header, detail boxes |
| Surface inner | `#f9fafb` | Submission item rows |
| Text primary | `#1f2937` | Headings, values |
| Text secondary | `#6b7280` | Labels, meta |
| Blue accent | `#0066cc` | Metrics, borders, active filters |
| Border | `#e5e7eb` | Dividers, card outlines |
| Approve | `#10b981` | Approve button |
| Reject | `#ef4444` | Reject button |

### Status / priority badges
| State | Background | Text |
|---|---|---|
| Pending | `#fef3c7` | `#92400e` |
| Approved | `#dcfce7` | `#166534` |
| Rejected | `#fee2e2` | `#991b1b` |
| Critical | `#fee2e2` | `#991b1b` |
| High | `#fef3c7` | `#92400e` |
| Medium | `#dbeafe` | `#0c4a6e` |
| Low | `#dcfce7` | `#166534` |

### Misc
| Token | Value | Used for |
|---|---|---|
| Card shadow | `0 4px 12px rgba(0,0,0,0.08)` | Elevation |
| Card radius | `12px` | Cards |
| Submission border | `4px solid #0066cc` | Left accent on submissions |
| Metric font | `2.5rem / 700` | KPI numbers |
