# Installing datarelief MCP

Get real-time global crisis data in Claude Desktop in 5 minutes.

---

## What is datarelief MCP?

An MCP server that gives Claude Desktop access to:
- Real-time crisis data
- Urgency scoring
- Funding gaps
- Verified organizations
- Manual submission support

**Result:** Ask Claude "Who needs help in the world?" and get current data with verified links.

---

## Quick Install (5 minutes)

### Step 1: Get the Code

**Option A: Clone from GitHub (Recommended)**

```bash
git clone https://github.com/datarelief-org/mcp.git datarelief-mcp
cd datarelief-mcp
npm install
npm run build
```

**Option B: Install from npm**

```bash
npm install -g @datarelief/mcp
```

**Option C: Use from gomezcollective** (if available)

Visit gomezcollective.com and install via their UI.

### Step 2: Find Your Installation Path

After installation, get the full path:

```bash
# If cloned from GitHub
pwd
# Example output: /Users/yourname/datarelief-mcp

# If npm global
npm list -g @datarelief/mcp
# Shows installation location
```

### Step 3: Configure Claude Desktop

**On Mac:** `~/.claude/claude_desktop_config.json`

**On Windows:** `%APPDATA%\claude\claude_desktop_config.json`

**On Linux:** `~/.claude/claude_desktop_config.json`

If the file doesn't exist, create it:

```json
{
  "mcpServers": {
    "datarelief": {
      "command": "node",
      "args": ["/full/path/to/datarelief-mcp/dist/index.js"]
    }
  }
}
```

**Replace `/full/path/to/` with your actual path from Step 2**

Example (Mac):
```json
{
  "mcpServers": {
    "datarelief": {
      "command": "node",
      "args": ["/Users/john/datarelief-mcp/dist/index.js"]
    }
  }
}
```

### Step 4: Restart Claude Desktop

Close and reopen Claude Desktop.

### Step 5: Test It

In Claude, ask:

```
"Who needs help in the world today?"
```

Claude should respond with crisis data and links to dashboards.

**Done!** ✅

---

## Troubleshooting

### Claude says "Tool not found"

**Problem:** Configuration path is wrong

**Solution:**
1. Check the path in config is correct
```bash
ls /Users/john/datarelief-mcp/dist/index.js
# Should NOT say "No such file"
```
2. Use `pwd` to get exact path
3. Update config and restart Claude

### Claude says "MCP server crashed"

**Problem:** Node.js not installed or wrong version

**Solution:**
```bash
node --version
# Should be v18+

# If not installed, get it from nodejs.org
```

### Can't find claude_desktop_config.json

**Solution:** Create it manually

```bash
# Mac/Linux
mkdir -p ~/.claude
touch ~/.claude/claude_desktop_config.json

# Then paste the config from Step 3
```

### Path issues on Windows?

Use forward slashes OR double backslashes:

```json
"args": ["C:\\Users\\John\\datarelief-mcp\\dist\\index.js"]
// OR
"args": ["C:/Users/John/datarelief-mcp/dist/index.js"]
```

---

## What You Can Now Ask

```
"Who needs help in the world?"
→ Get all urgent crises ranked by impact

"Compare Sudan and Afghanistan"
→ See side-by-side metrics

"Which crisis is most underfunded?"
→ Find high-impact donation opportunities

"Show me medical emergencies"
→ Filter by emergency type

"Get a dashboard for Venezuela earthquake"
→ Get link to detailed crisis dashboard
```

---

## Keep Data Updated

The MCP works with live data from:

**Option A: Manual Updates**
- Edit `data/crises.json`
- Push to GitHub
- Auto-rebuilds website

**Option B: Submit via Form**
- Visit https://datarelief.org/submit.html
- Your data updates automatically

**Option C: API Integration** (coming soon)
- Real-time updates from ReliefWeb
- Automatic sync with GlobalGiving

---

## Configuration Options

Edit `src/config.ts` to customize:

```typescript
export const config = {
  domain: "datarelief.org",              // Your domain
  siteName: "Crisis Relief Dashboard",
  contactEmail: "contact@datarelief.org",
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
};
```

Then rebuild:
```bash
npm run build
```

---

## For Developers

### Running Locally

```bash
npm run dev
# MCP server starts on stdio
```

### Building for Production

```bash
npm run build
# Creates dist/ folder
# Creates public/ folder (for website)
```

### Building Website Only

```bash
npm run generate:sites
# Just builds HTML dashboards
```

---

## File Structure

```
datarelief-mcp/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── global-crisis.ts   # Data aggregation
│   ├── config.ts          # Configuration
│   └── types.ts           # TypeScript types
├── data/
│   └── crises.json        # Edit this to update data
├── scripts/
│   └── generate-sites.js  # Builds HTML dashboards
├── dist/                  # Compiled output
├── public/                # Website (deploy to Vercel)
└── package.json
```

---

## Next Steps

1. ✅ Install MCP
2. ✅ Configure Claude Desktop
3. 🔄 Try asking Claude questions
4. 📝 Submit crisis data via form
5. 🔗 Share dashboards with others

---

## Need Help?

- **Installation issues?** See Troubleshooting above
- **Feature requests?** GitHub issues
- **Bug reports?** GitHub issues  
- **General questions?** Email contact@datarelief.org

---

## Version Information

Current: v1.0.0

Requires:
- Node.js 18+
- Claude Desktop (latest)
- ~50MB disk space

---

## License

MIT - Use freely, give credit

---

**Ready to help?** Install now and start asking Claude about global crises. 🌍
