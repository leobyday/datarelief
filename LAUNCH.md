# Launch Checklist - Complete Guide

Everything you need to launch datarelief as a standalone product.

---

## Phase 1: Infrastructure Setup (Week 1) ⚙️

### 1.1: Version Control

- [ ] Create GitHub account (if needed)
- [ ] Create repository: `datarelief-mcp`
- [ ] Clone locally
- [ ] Add `.gitignore`:
  ```
  node_modules/
  dist/
  .env
  .env.local
  ```
- [ ] Create initial commit: "Initial commit: datarelief MCP"
- [ ] Push to GitHub

**Time: 15 minutes**

---

### 1.2: Domain Setup

- [ ] Go to Namecheap.com
- [ ] Search: `datarelief.org`
- [ ] Buy domain (~$15/year)
- [ ] Note nameservers from purchase email
- [ ] Create Vercel account
- [ ] Add custom domain in Vercel project settings
- [ ] Update nameservers in Namecheap:
  ```
  ns1.vercel.com
  ns2.vercel.com
  ns3.vercel.com
  ns4.vercel.com
  ```
- [ ] Wait 24 hours for DNS propagation
- [ ] Test: `nslookup datarelief.org`

**Time: 20 minutes (plus 24h wait)**

---

### 1.3: Notifications (Discord)

- [ ] Create Discord server
- [ ] Create channels:
  - [ ] #submissions
  - [ ] #deployments
  - [ ] #analytics
- [ ] In #submissions, create webhook:
  ```
  Settings → Integrations → Webhooks → New
  ```
- [ ] Copy webhook URL
- [ ] Save to `.env`:
  ```
  DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
  ```

**Time: 10 minutes**

---

### 1.4: Data Storage (Vercel KV)

- [ ] Go to Vercel Dashboard
- [ ] Navigate to: Project → Storage → KV
- [ ] Create new KV database
- [ ] Name: `datarelief-submissions`
- [ ] Copy connection details:
  ```
  KV_URL=...
  KV_REST_API_URL=...
  KV_REST_API_TOKEN=...
  ```
- [ ] Add to `.env`
- [ ] Test connection:
  ```bash
  npm install vercel/kv
  ```

**Time: 15 minutes**

---

### 1.5: Environment Configuration

- [ ] Create `.env` file:
  ```bash
  # Domain
  CRISIS_DOMAIN=datarelief.org
  
  # Discord
  DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
  
  # Vercel KV
  KV_URL=redis://...
  KV_REST_API_URL=https://...
  KV_REST_API_TOKEN=...
  
  # Admin
  ADMIN_PASSWORD=temporary-password-change-this
  
  # Optional: GitHub
  GITHUB_TOKEN=ghp_...
  GITHUB_REPO=YOUR-USERNAME/datarelief-mcp
  ```

- [ ] Test that app can read `.env`:
  ```bash
  npm run dev
  # Should start without errors
  ```

**Time: 10 minutes**

---

## Phase 2: Code & Build (Week 1) 🛠️

### 2.1: Project Setup

- [ ] Clone latest code
- [ ] Install dependencies:
  ```bash
  npm install
  ```
- [ ] Build:
  ```bash
  npm run build
  ```
- [ ] Check for errors:
  ```
  ✅ Build complete! Generated 7 pages
  ```

**Time: 5 minutes**

---

### 2.2: Update Configuration

- [ ] Edit `src/config.ts`:
  ```typescript
  domain: "datarelief.org"
  contactEmail: "contact@datarelief.org"
  ```

- [ ] Update MCP endpoints in `src/index.ts`:
  ```typescript
  dashboardUrl: `https://datarelief.org/crises/${crisis.slug}/`
  ```

- [ ] Update form submission endpoint:
  ```javascript
  // public/submit.html
  formAction: "https://datarelief.org/api/submit"
  ```

- [ ] Update admin panel password:
  ```javascript
  // public/admin.html
  const ADMIN_PASSWORD = "your-secure-password"
  ```

**Time: 10 minutes**

---

### 2.3: Rebuild & Verify

- [ ] Rebuild project:
  ```bash
  npm run build
  ```

- [ ] Verify output:
  - [ ] `dist/index.js` exists (MCP server)
  - [ ] `public/index.html` exists (website)
  - [ ] `public/admin.html` exists (admin)
  - [ ] `public/submit.html` exists (form)

- [ ] Test locally:
  ```bash
  npm run serve:local
  # Visit http://localhost:8080
  # Should see homepage
  ```

**Time: 5 minutes**

---

## Phase 3: Deployment (Week 1) 🚀

### 3.1: Deploy Website to Vercel

- [ ] Connect GitHub repo to Vercel
- [ ] Configure build settings:
  ```
  Build Command: npm run build
  Output Directory: public
  ```

- [ ] Deploy:
  ```bash
  vercel --prod
  ```

- [ ] Test deployment:
  - [ ] Homepage loads: https://datarelief.org/
  - [ ] Crisis dashboard: https://datarelief.org/crises/sudan-2024/
  - [ ] Submit form: https://datarelief.org/submit.html
  - [ ] Admin: https://datarelief.org/admin

**Time: 15 minutes**

---

### 3.2: Verify Functionality

- [ ] Test form submission:
  - [ ] Fill form
  - [ ] Submit
  - [ ] Check Discord for notification
  - [ ] Check admin dashboard

- [ ] Test attribution tracking:
  - [ ] Click on /go/[crisis]/[org] link
  - [ ] Should redirect to organization
  - [ ] Check logs for click recorded

- [ ] Test API endpoints:
  ```bash
  curl https://datarelief.org/api/submit
  curl https://datarelief.org/api/analytics
  ```

**Time: 10 minutes**

---

## Phase 4: MCP Setup (Week 2) 📦

### 4.1: Claude Desktop Configuration

- [ ] Build MCP:
  ```bash
  npm run compile
  ```

- [ ] Get full path:
  ```bash
  pwd
  # Example: /Users/john/datarelief-mcp
  ```

- [ ] Update Claude Desktop config:
  
  **Mac:** `~/.claude/claude_desktop_config.json`
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

- [ ] Restart Claude Desktop
- [ ] Test in Claude:
  ```
  "Who needs help in the world?"
  ```

**Time: 10 minutes**

---

### 4.2: Create Installation Documentation

- [ ] Review `INSTALL.md` (already created)
- [ ] Test installation steps:
  ```bash
  # Fresh clone
  git clone https://github.com/YOUR-USERNAME/datarelief-mcp.git
  cd datarelief-mcp
  npm install
  npm run build
  ```

- [ ] Verify it works
- [ ] Update paths in INSTALL.md with actual URLs

**Time: 15 minutes**

---

### 4.3: Publish to npm (Optional)

- [ ] Create npm account (npmjs.com)
- [ ] Update `package.json`:
  ```json
  "name": "@datarelief/mcp",
  "version": "1.0.0"
  ```

- [ ] Publish:
  ```bash
  npm publish --access public
  ```

- [ ] Test installation:
  ```bash
  npm install -g @datarelief/mcp
  ```

**Time: 10 minutes (optional, can do later)**

---

## Phase 5: Data & Content (Week 2) 📊

### 5.1: Add Initial Crisis Data

- [ ] Review `data/crises.json`
- [ ] Add your own crisis data (or keep mock data for testing):
  ```json
  {
    "id": "your-crisis-id",
    "name": "Your Crisis Name",
    "country": "Country",
    "peopleAffected": 1000000,
    "estimatedNeeded": 50000000,
    "criticalNeeds": ["Item 1", "Item 2"]
  }
  ```

- [ ] Update last crisis to be recent
- [ ] Rebuild:
  ```bash
  npm run build
  ```

- [ ] Commit and push:
  ```bash
  git add data/crises.json
  git commit -m "Add initial crisis data"
  git push origin main
  ```

- [ ] Verify on https://datarelief.org

**Time: 15 minutes**

---

### 5.2: Update Documentation

- [ ] Customize `README.md`:
  ```markdown
  # datarelief.org
  
  MCP server for real-time global crisis coordination
  
  Install: npm install ... (or github clone)
  Docs: https://datarelief.org
  ```

- [ ] Review all markdown files:
  - [ ] INSTALL.md
  - [ ] USER_JOURNEY.md
  - [ ] DEPLOYMENT.md
  - [ ] INFRASTRUCTURE.md

- [ ] Update URLs to use datarelief.org
- [ ] Commit: "Update documentation"

**Time: 20 minutes**

---

### 5.3: Create FAQ Page

- [ ] Create `public/faq.html`
- [ ] Answer common questions:
  ```
  Q: How do I install the MCP?
  Q: How do I submit crisis data?
  Q: Who maintains this?
  Q: Is data accurate?
  Q: Can I integrate with my organization?
  ```

- [ ] Rebuild and deploy
- [ ] Add link in footer: https://datarelief.org/faq

**Time: 20 minutes**

---

## Phase 6: Testing (Week 2) ✅

### 6.1: Form Submission Testing

- [ ] Test form at /submit.html
- [ ] Fill with real test data
- [ ] Verify Discord notification
- [ ] Check admin dashboard
- [ ] Test "Approve" workflow
- [ ] Verify crises.json updated
- [ ] Confirm site rebuilt
- [ ] Check dashboard shows new data

**Time: 20 minutes**

---

### 6.2: Claude Integration Testing

- [ ] Ask different questions:
  ```
  "Who needs help?"
  "Show urgent crises"
  "Compare Sudan and Afghanistan"
  "What medical emergencies exist?"
  "Get Venezuela dashboard"
  ```

- [ ] Verify all return correct links
- [ ] Test all links work
- [ ] Verify dashboards render properly
- [ ] Check attribution tracking works

**Time: 15 minutes**

---

### 6.3: Performance Testing

- [ ] Check homepage load time (target: <2s)
- [ ] Check crisis dashboard load time
- [ ] Test on mobile:
  - [ ] Homepage responsive
  - [ ] Dashboard readable
  - [ ] Form usable
  - [ ] Links work

**Time: 10 minutes**

---

## Phase 7: Security (Week 2) 🔒

### 7.1: Secrets Management

- [ ] Verify `.env` is NOT in GitHub:
  ```bash
  git check-ignore .env  # Should return .env
  ```

- [ ] Add all secrets to Vercel:
  ```
  Vercel Dashboard → Settings → Environment Variables
  ```

- [ ] Test that app works without local `.env` file

**Time: 10 minutes**

---

### 7.2: Authentication

- [ ] Change admin password to secure one:
  ```
  At least 12 characters
  Mix of upper, lower, numbers, symbols
  Not reused from other services
  ```

- [ ] Update in:
  - [ ] `public/admin.html`
  - [ ] `.env` (ADMIN_PASSWORD)

- [ ] Test admin login works

**Time: 5 minutes**

---

### 7.3: Access Control

- [ ] Admin dashboard requires password ✅
- [ ] API endpoints rate-limited (for future)
- [ ] GitHub secrets protected ✅
- [ ] Discord webhook logged (for audit)

**Time: 5 minutes**

---

## Phase 8: Launch & Promotion (Week 3) 📢

### 8.1: Launch Announcement

Create announcement post:

```markdown
# datarelief.org is Live! 🌍

We've launched a free global crisis coordination platform.

Features:
- Real-time crisis data
- Verified organization links
- Manual data submission for governments/NGOs
- Integration with Claude Desktop
- 100% free

Try it:
1. Ask Claude: "Who needs help in the world?"
2. Or visit: https://datarelief.org

MCP Install: [link to INSTALL.md]
GitHub: [link to repo]
```

**Platforms to share:**
- [ ] Reddit: r/Claude, r/MachineLearning
- [ ] Twitter: Share with humanitarian orgs
- [ ] Product Hunt (optional)
- [ ] Hacker News (optional)
- [ ] Email to humanitarian organizations

**Time: 30 minutes**

---

### 8.2: Reach Out to Organizations

Send emails to:
- [ ] UN OCHA
- [ ] Red Cross chapters
- [ ] Doctors Without Borders
- [ ] CARE International
- [ ] Save the Children
- [ ] Local NGOs

```
Subject: datarelief.org - Free Crisis Coordination Platform

Hi [Organization],

We've built datarelief.org - a real-time platform for 
crisis coordination and data sharing.

You're currently listed as active in [crisis].
Would you like to:
- Update your listed needs?
- Submit additional items needed?
- Claim your organization page?

Visit: https://datarelief.org/submit.html

Best,
[Your Name]
```

**Time: 1 hour**

---

### 8.3: Create Promotional Assets

- [ ] Screenshot of dashboard
- [ ] Screenshot of Claude interaction
- [ ] Demo video (optional)
- [ ] One-pager PDF
- [ ] Social media graphics

**Time: 1 hour**

---

## Phase 9: Monitoring (Ongoing) 📈

### 9.1: Weekly Checks

- [ ] Check submitted items in Discord
- [ ] Review pending approvals
- [ ] Check analytics (click-through rates)
- [ ] Monitor error logs
- [ ] Verify DNS still working

**Time: 15 minutes/week**

---

### 9.2: Monthly Checks

- [ ] Update crisis data (funding, status)
- [ ] Review user feedback
- [ ] Check Vercel analytics
- [ ] Plan next features
- [ ] Reach out to organizations

**Time: 1 hour/month**

---

## Phase 10: Scaling (After Launch)

### 10.1: Early Wins

- [ ] First crisis submission approved
- [ ] First organization partnership
- [ ] First news mention
- [ ] First 100 MCP installs
- [ ] First 1000 dashboard visitors

### 10.2: Feature Roadmap

- [ ] Real API data (ReliefWeb, GlobalGiving)
- [ ] Email notifications
- [ ] Automated approvals
- [ ] Donation processing (optional)
- [ ] Mobile app (future)

---

## Complete Timeline

```
Week 1 (40 hours):
├─ Infrastructure setup (40 min)
├─ Code & build (30 min)
├─ Deployment (25 min)
└─ MCP setup (20 min)

Week 2 (50 hours):
├─ Data & content (50 min)
├─ Testing (45 min)
├─ Security (20 min)
└─ Launch prep (1 hour)

Week 3 (10 hours):
├─ Launch announcements
├─ Outreach
├─ Promotional assets
└─ Monitoring setup

Total: ~2-3 weeks, mostly setup + waiting
```

---

## Critical Path (Minimum to Launch)

If you're in a hurry, do only:

```
Day 1 (2 hours):
├─ GitHub repo
├─ Vercel deployment
└─ Basic configuration

Day 2 (2 hours):
├─ Claude Desktop setup
├─ Manual testing
└─ Launch announcement

Total: 4 hours to "launch"
Then: Iterate based on feedback
```

---

## Success Metrics

You'll know you're successful when:

```
Week 1:
✅ Website loads
✅ Form submissions work
✅ Claude integration works

Month 1:
✅ First submission approved
✅ First organization partnership
✅ 100+ dashboard visitors

Month 3:
✅ 5+ crises with data
✅ 10+ organization partnerships
✅ 1000+ dashboard visitors
✅ Measurable click-through attribution
```

---

## Support During Launch

- Discord for notifications ✅
- Email for backups (optional)
- GitHub issues for bugs
- Direct email for partnerships
- Regular updates to team

---

## You're Ready! 🚀

Follow this checklist and you'll have a production-ready crisis coordination platform in 2-3 weeks.

Start with Phase 1 today!
