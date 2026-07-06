import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  const { crisis, org } = req.query;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  const referer = req.headers['referer'] || req.headers['referrer'] || 'direct';
  const client = ua.includes('Claude') ? 'claude-desktop' : 'other';

  // Look up crisis + org data before logging so we can enrich the event
  let donationUrl = null;
  let crisisName = null;
  let orgName = null;
  let linkType = 'donate'; // default — may be 'volunteer' if we distinguish later

  try {
    const dataPath = join(process.cwd(), 'data', 'crises.json');
    const crises = JSON.parse(readFileSync(dataPath, 'utf8'));
    const crisisData = crises.find(c => c.slug === crisis);
    if (crisisData) {
      crisisName = crisisData.name;
      const orgData = crisisData.organizations.find(o => o.slug === org);
      if (orgData) {
        donationUrl = orgData.donationUrl;
        orgName = orgData.name;
      }
    }
  } catch (err) {
    console.error(JSON.stringify({ type: 'redirect_error', error: err.message, crisis, org }));
  }

  // Structured attribution log — primary analytics signal
  console.log(JSON.stringify({
    type: 'redirect_click',
    timestamp: new Date().toISOString(),
    crisis_slug: crisis,
    crisis_name: crisisName,
    org_slug: org,
    org_name: orgName,
    link_type: linkType,
    destination: donationUrl,
    resolved: !!donationUrl,
    ip,
    ua,
    client,
    referer,
  }));

  if (!donationUrl) {
    return res.redirect(302, 'https://datarelief.org');
  }

  return res.redirect(302, donationUrl);
}
