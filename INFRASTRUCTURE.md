# Infrastructure & Support Systems Guide

Complete guide to supporting manual data submissions and managing the platform.

---

## Overview

Your platform needs:

```
1. Form for submissions (/submit.html)        ✅ Have it
2. Notification system                        ⚠️ Choose one
3. Data storage                               ⚠️ Choose one
4. Admin dashboard                            ✅ Have it
5. Approval workflow                          ⚠️ Set up
6. Attribution tracking                       ⚠️ Set up
```

**Cost: $0-10/month depending on choices**

---

## Part 1: Notification System (Choose One)

### Option A: Discord Webhook (Recommended - FREE)

**Best for:** Small teams, fast notifications

```
Setup (5 minutes):
1. Create Discord server
2. Create #submissions channel
3. Get webhook URL
4. Add to .env: DISCORD_WEBHOOK_URL=...
```

**What you get:**
- ✅ Instant notifications
- ✅ Can approve/reject in Discord
- ✅ Searchable history
- ✅ FREE forever

**Process:**
```
User submits form
    ↓
Discord notification posted
    ↓
You review & click "approve"
    ↓
(Feature coming) Auto-updates crises.json
```

**Setup Discord webhook:**
```
1. Go to: Discord server → #submissions → Settings
2. Webhooks → New Webhook
3. Copy URL
4. Add to .env file
```

---

### Option B: Email Notifications (Traditional)

**Best for:** Non-technical team members

```
Setup (10 minutes):
1. Choose email service
2. Get API credentials
3. Add to .env
4. Test with sendgrid/mailgun
```

**Email Services (Choose One):**

**SendGrid** (Recommended)
```
- Free tier: 100 emails/day
- Cost: $0-20/month
- Setup: 5 minutes
```

```bash
npm install @sendgrid/mail

# .env
SENDGRID_API_KEY=SG.xxxxx
ADMIN_EMAIL=you@datarelief.org
```

**Mailgun**
```
- Free tier: 5K emails/month
- Cost: $0-35/month
- Setup: 5 minutes
```

**Brevo (formerly Sendinblue)**
```
- Free tier: 300 emails/day
- Cost: $0-20/month
- Setup: 5 minutes
```

**Process:**
```
User submits form
    ↓
Email sent to admin@datarelief.org
    ↓
You review & reply "APPROVE"
    ↓
(Feature coming) Auto-updates crises.json
```

---

### Option C: Both Discord + Email (Best)

**Setup:**
```
User submits
    ↓
Discord notification (instant)
AND
Email notification (formal record)
    ↓
You review
    ↓
Admin dashboard shows pending items
    ↓
Click "Approve"
    ↓
Auto-updates crises.json + GitHub PR
```

**Cost:** Still free! (Discord + Sendgrid free tiers)

---

## Part 2: Data Storage (Choose One)

### Option A: JSON File in GitHub (Simple)

**How it works:**
```
1. User submits via form
2. Bot creates GitHub PR with new submission
3. You review PR
4. You click "Approve"
5. PR merges → crises.json updated → site rebuilds
```

**Cost:** FREE

**Setup:** Need GitHub token + bot

**Pros:**
- ✅ Everything tracked in Git
- ✅ Full audit trail
- ✅ Rollback if needed
- ✅ FREE

**Cons:**
- ❌ Need to manage GitHub tokens
- ❌ Slightly technical

---

### Option B: Vercel KV (Simple)

**How it works:**
```
User submits
    ↓
Data stored in Vercel KV
    ↓
Admin dashboard loads from KV
    ↓
Click "Approve"
    ↓
Saves to crises.json
```

**Cost:** Free (up to 25K requests/day)

**Setup:** 
```
1. vercel.com → Dashboard
2. Storage → KV
3. Create KV store
4. Copy credentials to .env
```

**Pros:**
- ✅ Super fast
- ✅ Easy to set up
- ✅ FREE tier generous

**Cons:**
- ❌ Vendor lock-in (Vercel)

---

### Option C: Firestore (Google)

**How it works:**
```
User submits
    ↓
Data stored in Firestore
    ↓
Admin dashboard queries Firestore
    ↓
Click "Approve"
    ↓
Auto-updates crises.json + Github
```

**Cost:** 
- Free tier: 50K reads, 20K writes/day
- Paid: ~$6-100/month for more

**Setup (15 minutes):**
```
1. firebase.google.com
2. Create project
3. Enable Firestore
4. Create service account
5. Add credentials to .env
```

**Pros:**
- ✅ Powerful queries
- ✅ Real-time sync
- ✅ Google-backed
- ✅ Generous free tier

**Cons:**
- ⚠️ Slightly more setup
- ⚠️ Vendor lock-in (Google)

---

### Option D: MongoDB Atlas (Powerful)

**How it works:**
```
Same as above but with MongoDB
```

**Cost:**
- Free tier: 512MB storage, shared cluster
- Paid: $9+/month for dedicated

**Setup (20 minutes):**
```
1. mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Add to .env
```

**Pros:**
- ✅ Most powerful
- ✅ NoSQL flexibility
- ✅ Scalable

**Cons:**
- ⚠️ Overkill for MVP
- ⚠️ Learning curve

---

## My Recommendation for MVP

**Use:**
```
Notifications: Discord webhook (instant, free)
Storage: Vercel KV (simple, free)
Approval: Admin dashboard (web-based, no email needed)
Audit: GitHub (all changes tracked)
```

**Why:**
- ✅ All FREE
- ✅ Takes 30 minutes to set up
- ✅ Handles thousands of submissions
- ✅ Easy to understand
- ✅ Can upgrade later

---

## Part 3: Complete Setup Instructions

### Step 1: Set Up Discord Webhook

```bash
# Create discord server at discord.com
# In #submissions channel:
# Settings → Integrations → Webhooks → New

# Copy webhook URL

# In your .env file:
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Step 2: Set Up Vercel KV

```bash
# In Vercel Dashboard:
# 1. Project → Storage → KV
# 2. Create database
# 3. Copy credentials

# In .env:
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

### Step 3: Test Submission

```bash
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "Test Org",
    "email": "test@example.com",
    "items": [{"name": "Test", "qty": 1, "unit": "units"}],
    "crisisName": "Test Crisis"
  }'
```

**Expected:**
```
Discord message appears
KV stores submission
Response: { success: true, submissionId: "..." }
```

### Step 4: Set Admin Password

```bash
# In public/admin.html, update:
const ADMIN_PASSWORD = 'your-secure-password-here';

# Users visit: datarelief.org/admin
# Enter password
# See all submissions
# Click approve/reject
```

---

## Part 4: Attribution Tracking

### Redirect URLs for Tracking

Already set up in `/api/go/[crisis]/[org]/`

**How it works:**

```
MCP returns: https://datarelief.org/go/sudan-2024/save-the-children/
                                     ↑ crisis id
                                                  ↑ org slug

User clicks → Our redirect endpoint captures click → Redirects to org donation page
                                                      ↓
                                            Save the Children donation page
```

**What we log:**
```json
{
  "timestamp": "2024-07-05T12:30:00Z",
  "crisis": "sudan-2024",
  "organization": "save-the-children",
  "source": "claude-mcp",
  "userAgent": "Mozilla/5.0..."
}
```

### Analytics Dashboard

Visit `/analytics` to see:
```
This week:
├─ Sudan: 1,247 clicks
├─ Afghanistan: 892 clicks
└─ Total: 2,139 clicks

By organization:
├─ Save the Children: 456
├─ Doctors Without Borders: 342
└─ CARE: 449

Estimated donations influenced: $50K+
```

---

## Part 5: Approval Workflow

### When Submission Comes In

```
1. Discord notification
   ├─ Shows: Organization, items, contact
   └─ You click: "Review on dashboard"

2. You visit: datarelief.org/admin
   ├─ Enter admin password
   ├─ See: All pending submissions
   └─ You click: "Approve" or "Edit"

3. If approved:
   ├─ Creates GitHub PR with updated crises.json
   ├─ Merges automatically (for now)
   ├─ Site rebuilds (2 minutes)
   └─ Dashboard shows new data ✨

4. Notification sent back:
   ├─ Email: "Your submission has been approved"
   └─ Discord: "✅ Sudan submission merged"
```

---

## Part 6: Environment Variables (`.env`)

Create `.env` file at project root:

```bash
# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Vercel KV
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# GitHub (for auto-PRs)
GITHUB_TOKEN=ghp_...
GITHUB_REPO=YOUR-USERNAME/datarelief-mcp
GITHUB_BRANCH=main

# Email (if using SendGrid)
SENDGRID_API_KEY=SG_...
ADMIN_EMAIL=contact@datarelief.org

# Admin
ADMIN_PASSWORD=change-me-immediately

# Domain
CRISIS_DOMAIN=datarelief.org
```

**⚠️ Never commit `.env` to GitHub!**

```bash
# Add to .gitignore:
.env
.env.local
.env.*.local
```

---

## Part 7: Automation (Future)

Once infrastructure is solid, automate:

```
1. Auto-approve low-risk submissions
   ├─ Same organization as before?
   ├─ Same crisis?
   └─ Auto-approve, send notification

2. Auto-update funding amounts
   ├─ Query GlobalGiving API daily
   ├─ Update crises.json
   ├─ Rebuild site
   └─ Send notifications if gap changed

3. Weekly digest
   ├─ How many submissions?
   ├─ Which crises updated?
   ├─ How many clicks from MCP?
   └─ Send to team

4. Auto-notify organizations
   ├─ "datarelief.org sent you 156 clicks"
   ├─ "Estimated donations: $12K"
   └─ "Keep your data current"
```

---

## Cost Summary

| Component | Option | Cost | Setup |
|-----------|--------|------|-------|
| **Notifications** | Discord | FREE | 5 min |
| **Storage** | Vercel KV | FREE | 5 min |
| **Database** | GitHub + JSON | FREE | 0 min |
| **Hosting** | Vercel | FREE | 0 min |
| **Domain** | Namecheap | $15/yr | 10 min |
| **Email** | SendGrid (optional) | FREE | 5 min |
| **TOTAL/MONTH** | **All tiers** | **$0-2/mo** | **30 min** |

---

## MVP Launch Checklist

### Week 1: Core Infrastructure

- [ ] Create Discord webhook
- [ ] Set up Vercel KV
- [ ] Configure .env
- [ ] Test /api/submit endpoint
- [ ] Set admin password in admin.html
- [ ] Deploy to Vercel

### Week 2: Data & Testing

- [ ] Add sample crises to crises.json
- [ ] Test form submission
- [ ] Test Discord notification
- [ ] Test admin dashboard
- [ ] Test approval workflow
- [ ] Test site rebuild after approval

### Week 3: Promotion

- [ ] Create GitHub repo
- [ ] Write INSTALL.md
- [ ] Deploy MCP
- [ ] Set up documentation site
- [ ] Share with early users

### Week 4: Feedback & Polish

- [ ] Gather feedback from submissions
- [ ] Improve form UX
- [ ] Add email notifications
- [ ] Set up analytics
- [ ] Plan next features

---

## Support System Workflow

```
Day 1: You set up infrastructure
       ├─ Discord webhook (5 min)
       ├─ Vercel KV (5 min)
       └─ Deploy (5 min)

Day 2: Venezuelan Embassy submits
       ├─ Form receives submission
       ├─ Discord notifies you
       ├─ KV stores it
       └─ Admin dashboard shows it

Day 3: You review & approve
       ├─ Click "Approve" in dashboard
       ├─ GitHub PR created
       ├─ Site rebuilds (2 min)
       ├─ Embassy notified
       └─ Data live on datarelief.org

Day 4: Users see updated data
       ├─ MCP returns updated link
       ├─ Organization sees new needs
       └─ Help arrives faster
```

**Total effort: ~2 hours of setup + 5 minutes per submission to approve**

---

## Next Steps

1. **Set up Discord** (5 min)
2. **Set up Vercel KV** (5 min)
3. **Test submission flow** (10 min)
4. **Deploy to Vercel** (5 min)
5. **Test end-to-end** (10 min)

**Total: 35 minutes**

Then you're ready to accept submissions! 🎉
