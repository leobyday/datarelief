# Component Inventory — DataRelief

> Catalogues every UI component in the admin dashboard. V2 website components TBD.

---

## MetricCard

**Source:** Custom
**File:** `admin.html` — `.card` inside `.grid`
**Used on:** Admin dashboard (4 cards: pending, approved, total, active crises)

| State | Description |
|---|---|
| Default | White card, `12px` radius, shadow. Large blue metric number + uppercase gray label |
| Loading | Metric shows `0` until `loadSubmissions()` resolves |

**Rules:**
- Metric number always uses `--blue` (`#0066cc`) and `2.5rem / 700`
- Label always uppercase, `0.85rem`, `#6b7280`
- Never put actions inside a metric card

---

## SubmissionItem

**Source:** Custom
**File:** `admin.html` — `.submission-item`
**Used on:** Admin dashboard submissions list

| State | Description |
|---|---|
| Pending | Left border `4px solid #0066cc`, shows Approve + Reject buttons |
| Approved | Left border retained; no action buttons shown |
| Rejected | Left border retained; no action buttons shown |

**Rules:**
- Always show status badge in top-right (pill, 20px radius)
- Items list rendered inside white inner box, `6px` radius
- Priority badge always inline next to item name
- Edit button always shown regardless of status (V1: stub)

---

## StatusBadge

**Source:** Custom
**File:** `admin.html` — `.status-badge`
**Used on:** SubmissionItem header

**Variants:**
| Variant | Background | Text |
|---|---|---|
| pending | `#fef3c7` | `#92400e` |
| approved | `#dcfce7` | `#166534` |
| rejected | `#fee2e2` | `#991b1b` |

**Rules:**
- Always uppercase text
- `6px 12px` padding, `20px` border-radius
- Never use color alone to convey status — always show the text label

---

## PriorityTag

**Source:** Custom
**File:** `admin.html` — `.priority`
**Used on:** Item rows inside SubmissionItem

**Variants:** critical · high · medium · low (see design/tokens.md for colors)

**Rules:**
- Inline, immediately after the item name
- `2px 8px` padding, `4px` radius
- Always lowercase in data; display however the data provides it

---

## FilterBar

**Source:** Custom
**File:** `admin.html` — `.filter-bar` with `.filter-btn`
**Used on:** Admin submissions section

| State | Description |
|---|---|
| Active | `#0066cc` background, white text |
| Inactive | `#e5e7eb` background, `#1f2937` text |
| Hover | `opacity: 0.9` on active; subtle on inactive |

**Rules:**
- Only one filter active at a time
- Always include "All" as the default/reset option

---

## ActionButton

**Source:** Custom
**File:** `admin.html` — `.btn`
**Used on:** SubmissionItem actions

**Variants:**
| Variant | Color | Purpose |
|---|---|---|
| `btn-approve` | `#10b981` | Approve pending submission |
| `btn-reject` | `#ef4444` | Reject pending submission |
| `btn-edit` | `#0066cc` | Edit any submission |

**Rules:**
- Approve and Reject only shown when status is `pending`
- Edit always shown
- `10px 20px` padding, `6px` radius, `font-weight: 600`
- Hover: `opacity: 0.9` — no color change

---

## LoginSection

**Source:** Custom
**File:** `admin.html` — `#loginSection`
**Used on:** Admin page (unauthenticated state)

| State | Description |
|---|---|
| Default | Centered, max-width 400px, white card, password input + login button |
| Error | `alert()` shown (V1 MVP — replace with inline error in V2) |

**Rules:**
- Never shown simultaneously with `#dashboard`
- Password input is type="password" — never type="text"
- Login button uses `#0066cc`
