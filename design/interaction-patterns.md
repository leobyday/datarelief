# Interaction Patterns — DataRelief

> Applies to admin dashboard and any future web UI. MCP responses follow Claude's own rendering.

## Hover
- Buttons: `opacity: 0.9` over `200ms` — no color change, just dim
- Filter chips: same `opacity: 0.9`
- Cursor: `pointer` on all interactive elements (buttons, filter chips)

## Focus
- Inputs: browser default focus ring (not overridden in V1)
- Buttons: browser default
- Never remove focus indicators — only restyle if needed for brand consistency

## Transitions
- Button opacity: `0.2s` (from `admin.html`)
- Filter chip state change: `0.2s`
- Show/hide dashboard vs login: immediate (no transition — security surface, don't animate)

## Loading states
- Metrics: show `0` on page load; update when `loadSubmissions()` resolves
- Submissions list: empty until API call completes (V1: no skeleton — add in V2 if latency is noticeable)

## Empty states
- Submissions list with no results: centered icon (`📭`) + muted text "No submissions yet"
- Filtered view with no matches: same empty state pattern — no borders or card chrome

## Error states (V1)
- Wrong admin password: `alert()` — acceptable for V1 internal tool
- Approve/reject (stub): `alert()` with "Feature coming soon" message
- Form submission failure: `NextResponse.json({ error: '...' }, { status: 400/500 })` — form should surface this inline

## MCP response patterns (markdown only)
Since MCP responses render as markdown in Claude Desktop:
- Use **bold** for crisis names and key figures
- Use a numbered list for ranked crises (ranking is the core value)
- Always include the last-updated date in parentheses after any figure: `$2.3B gap (as of 2024-11-01)`
- Always end with a redirect link using descriptive anchor text: `[Donate via Save the Children →](https://datarelief.org/api/go/sudan-2024/save-the-children)`
- Stale data warning: blockquote at the top of the response — `> ⚠️ Data last updated [date]. Figures may have changed.`
