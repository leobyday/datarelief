import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  const { crisis, org } = req.query;

  // Log the attribution event — this is the primary analytics signal
  const event = {
    type: 'redirect_click',
    timestamp: new Date().toISOString(),
    crisis,
    org,
    source: 'claude-mcp',
    userAgent: req.headers['user-agent'] || 'unknown'
  };
  console.log('[attribution]', JSON.stringify(event));

  // Look up the donation URL from crisis data
  let donationUrl = null;
  try {
    const dataPath = join(process.cwd(), 'data', 'crises.json');
    const crises = JSON.parse(readFileSync(dataPath, 'utf8'));
    const crisisData = crises.find(c => c.slug === crisis);
    if (crisisData) {
      const orgData = crisisData.organizations.find(o => o.slug === org);
      if (orgData) donationUrl = orgData.donationUrl;
    }
  } catch (err) {
    console.error('[attribution] Failed to read crisis data:', err);
  }

  if (!donationUrl) {
    // Fallback — send to a safe default rather than dropping the user
    console.warn(`[attribution] No URL found for crisis=${crisis} org=${org}`);
    return res.redirect(302, 'https://datarelief.org');
  }

  return res.redirect(302, donationUrl);
}
