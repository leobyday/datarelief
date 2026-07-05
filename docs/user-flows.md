# User Flows — DataRelief

> Flows marked ✅ are derived from existing code. Flows marked ⚠️ need implementation.

---

## Flow 1: Donor queries crises via Claude Desktop ✅ (MCP core flow)

**Entry point:** Claude Desktop conversation — user types a natural language question
**Goal:** Donor finds a high-impact crisis and reaches a verified donation path
**Auth required:** No (Claude Pro required to use MCP)

### Happy path
1. User asks: *"Who needs help in the world?"* or *"Which crisis is most underfunded?"*
2. MCP server receives tool call, queries `data/crises.json`, ranks by urgency/funding gap
3. **MCP logs the query** — timestamp, query text, crises returned (attribution event #1)
4. MCP returns ranked crisis list with: name, country, people affected, funding gap, last-updated date, and redirect URLs for verified orgs
5. User reads summary in Claude, clicks a redirect link (e.g. `datarelief.org/api/go/sudan-2024/save-the-children`)
6. **Redirect endpoint logs the click** — crisis ID, org slug, source, timestamp (attribution event #2)
7. User lands on the org's donation page

**End state:** User is on a verified donation page. Both MCP query and redirect click are logged.

### Edge cases
- **Stale data:** If `lastUpdated` is >30 days ago, MCP response includes: *"Note: this data was last updated on [date]. Figures may have changed."*
- **No matching crisis:** MCP returns the full ranked list rather than an empty result
- **Redirect URL unavailable:** Log the failure; return org's homepage as fallback, never drop the user

---

## Flow 2: Donor asks a comparison or filter query ⚠️ (needs implementation)

**Entry point:** Claude Desktop — specific filter question
**Goal:** Donor narrows to the crisis that fits their intent (geography, crisis type, scale)
**Auth required:** No

### Happy path
1. User asks: *"Compare Sudan and Afghanistan"* or *"Show me medical emergencies"*
2. MCP parses intent, filters/compares crises from `data/crises.json`
3. MCP logs the query (attribution event #1)
4. MCP returns comparison table or filtered list with redirect URLs
5. User clicks redirect → attribution event #2 logged → user lands on donation page

### Edge cases
- **Filter returns 0 results:** Return the closest match with a note explaining the gap
- **Comparison: one crisis has stale data:** Flag only the stale one; don't degrade the whole response

---

## Flow 3: NGO/government submits crisis data ✅

**Entry point:** `/submit.html` (V1: linked from gomezcollective; V2: datarelief.org/submit.html)
**Goal:** A verified organization adds or updates needs for a crisis
**Auth required:** No (submission goes to manual review)

### Happy path
1. Submitter fills form: organization name, email, crisis name, items needed (name, quantity, unit, priority), notes
2. Form POSTs to `POST /api/submit`
3. API validates required fields (organization, email, items, crisisName)
4. Submission stored to Vercel KV with status `pending` and a generated ID
5. Discord webhook fires — admin sees the submission in #submissions channel
6. Admin is notified to review

**End state:** Submission stored, Discord notified, submitter receives confirmation with submission ID.

### Edge cases
- **Missing required fields:** API returns 400 with `{ error: 'Missing required fields' }` — form shows inline error
- **API down:** Form shows error state; submitter can email directly
- **Discord webhook fails:** Submission is still stored to KV; Discord failure is logged but doesn't block the user

---

## Flow 4: Admin reviews submissions ✅ (read-only in V1)

**Entry point:** `/admin` (or `/admin.html`) — direct URL, not linked publicly
**Goal:** Admin sees all pending submissions and their status
**Auth required:** Yes — admin password via sessionStorage

### Happy path
1. Admin visits `/admin`
2. If not authenticated: password prompt appears
3. Admin enters password → stored in `sessionStorage` → dashboard loads
4. Admin sees metrics: pending count, approved count, total, active crises
5. Admin filters by status (all / pending / approved / rejected)
6. Admin reviews each submission: org, contact, crisis, items needed with priority badges

**End state (V1):** Admin has visibility into submissions. Approve/reject actions are stubs ("coming soon").
**End state (V2):** Clicking Approve triggers GitHub PR to update crises.json → site rebuilds.

### Edge cases
- **Wrong password:** Alert shown; session not set; dashboard stays hidden
- **Empty state:** "No submissions yet" message with icon
- **Session expired:** On next visit, password prompt reappears (sessionStorage is cleared on tab close)

---

## Attribution data model

Every logged event should capture:

```json
// MCP query log (event #1)
{
  "type": "mcp_query",
  "timestamp": "ISO-8601",
  "query": "who needs help in the world",
  "crisesReturned": ["sudan-2024", "venezuela-earthquake"],
  "source": "claude-mcp"
}

// Redirect click log (event #2)
{
  "type": "redirect_click",
  "timestamp": "ISO-8601",
  "crisis": "sudan-2024",
  "org": "save-the-children",
  "source": "claude-mcp",
  "userAgent": "Mozilla/5.0..."
}
```
