#!/usr/bin/env node

/**
 * Fetch real crisis data
 *
 * Sources:
 *   - GDACS RSS (gdacs.org) — live natural disasters, no API key needed
 *   - every.org public API — verified nonprofits with donation links
 *   - Curated humanitarian crises — conflict/famine/displacement
 *
 * TODO: When ReliefWeb appname is approved, add RELIEFWEB_APPNAME env var
 * and uncomment the ReliefWeb block in main().
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'data', 'crises.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

function extractXml(block, tag) {
  const re = new RegExp(`<(?:[a-z]+:)?${tag}[^>]*>([\\s\\S]*?)<\/(?:[a-z]+:)?${tag}>`, 'i');
  const m = block.match(re);
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : '';
}

function extractAttr(block, tag, attr) {
  const re = new RegExp(`<(?:[a-z]+:)?${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const m = block.match(re);
  return m ? m[1] : '';
}

function getCriticalNeeds(type, name) {
  const lower = (type + ' ' + name).toLowerCase();
  if (lower.includes('eq') || lower.includes('earthquake'))  return ['Shelter', 'Medical supplies', 'Water', 'Food', 'Search & rescue'];
  if (lower.includes('tc') || lower.includes('cyclone') || lower.includes('hurricane')) return ['Shelter', 'Water', 'Food', 'Medical supplies', 'Generators'];
  if (lower.includes('fl') || lower.includes('flood'))       return ['Water purification', 'Medical supplies', 'Shelter', 'Food'];
  if (lower.includes('dr') || lower.includes('drought'))     return ['Water', 'Food', 'Livestock feed', 'Medical supplies'];
  if (lower.includes('vo') || lower.includes('volcano'))     return ['Evacuation support', 'Shelter', 'Respiratory masks', 'Food'];
  if (lower.includes('wf') || lower.includes('fire'))        return ['Evacuation support', 'Shelter', 'Medical supplies', 'Food'];
  if (lower.includes('conflict') || lower.includes('war'))   return ['Medical supplies', 'Food', 'Shelter', 'Water', 'Psychological support'];
  if (lower.includes('famine') || lower.includes('food'))    return ['Food', 'Water', 'Medical care', 'Seeds'];
  return ['Food', 'Water', 'Medical supplies', 'Shelter'];
}

function alertToPopulation(alertLevel, popText) {
  const lower = (popText || '').toLowerCase();
  if (lower.includes('million'))          return 2_000_000;
  if (lower.includes('hundred thousand')) return 400_000;
  if (lower.includes('thousands'))        return 80_000;
  if (lower.includes('few'))              return 5_000;
  if (alertLevel === 'Red')               return 1_000_000;
  if (alertLevel === 'Orange')            return 200_000;
  return 30_000;
}

function urgencyFromAlert(alertLevel, alertScore, eventType) {
  let base = alertLevel === 'Red' ? 75 : alertLevel === 'Orange' ? 55 : 35;
  base += Math.min(20, Math.round((alertScore || 0) / 5));
  if (['EQ', 'TC'].includes(eventType)) base += 5;
  return Math.min(100, base);
}

// ─── every.org API ────────────────────────────────────────────────────────────
// Public search endpoint — no API key required for read access.
// Donation URL pattern: https://www.every.org/<slug>#donate

async function fetchEveryOrgOrgs(query, causes = 'humanitarian,disaster-relief', take = 3) {
  try {
    const url = `https://api.every.org/public/search?q=${encodeURIComponent(query)}&causes=${causes}&take=${take}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const nonprofits = data?.nonprofits || data?.data || [];
    if (!nonprofits.length) return null;
    return nonprofits.map(n => ({
      slug: n.slug || toSlug(n.name),
      name: n.name,
      donationUrl: `https://www.every.org/${n.slug}#donate`,
      volunteerUrl: n.profileUrl || `https://www.every.org/${n.slug}`,
    }));
  } catch {
    return null;
  }
}

// ─── Curated resources (articles / guides / reports) ─────────────────────────
// "How to help" content per crisis — donors need context, not just a donate button.

const CRISIS_RESOURCES = {
  'curated-sudan-2024': [
    { title: 'How to help people affected by the Sudan crisis', url: 'https://www.rescue.org/article/how-help-people-affected-sudan-crisis', source: 'IRC', type: 'guide' },
    { title: 'Sudan emergency response overview', url: 'https://www.unhcr.org/emergencies/sudan-emergency', source: 'UNHCR', type: 'report' },
  ],
  'curated-gaza-2024': [
    { title: 'How to help people in Gaza', url: 'https://www.rescue.org/article/how-help-people-gaza', source: 'IRC', type: 'guide' },
    { title: 'Gaza humanitarian situation report', url: 'https://www.ochaopt.org/', source: 'OCHA', type: 'report' },
  ],
  'curated-afghanistan-2024': [
    { title: 'Afghanistan crisis — how to help', url: 'https://www.rescue.org/article/afghanistan-crisis-what-you-should-know', source: 'IRC', type: 'guide' },
    { title: 'Afghanistan humanitarian dashboard', url: 'https://reliefweb.int/country/afg', source: 'ReliefWeb', type: 'report' },
  ],
  'curated-ethiopia-2024': [
    { title: 'Ethiopia emergency — how to help', url: 'https://www.rescue.org/article/ethiopia-emergency-how-help', source: 'IRC', type: 'guide' },
    { title: 'Ethiopia food security situation', url: 'https://reliefweb.int/country/eth', source: 'ReliefWeb', type: 'report' },
  ],
  'curated-venezuela-2024': [
    { title: 'How to help survivors of the Venezuela crisis', url: 'https://www.rescue.org/article/venezuelan-crisis-what-you-should-know', source: 'IRC', type: 'guide' },
    { title: 'Venezuela displacement emergency', url: 'https://www.unhcr.org/emergencies/venezuela-situation', source: 'UNHCR', type: 'report' },
  ],
};

// Fallback guide for GDACS natural disasters
const DISASTER_RESOURCES = [
  { title: 'How to help disaster survivors', url: 'https://www.rescue.org/article/how-help-after-natural-disaster', source: 'IRC', type: 'guide' },
  { title: 'GDACS event information', url: 'https://www.gdacs.org/', source: 'GDACS', type: 'report' },
];

// ─── Curated humanitarian crises ─────────────────────────────────────────────

const HUMANITARIAN_CRISES = [
  {
    id: 'curated-sudan-2024',
    name: 'Sudan Humanitarian Crisis',
    country: 'Sudan',
    slug: 'sudan-humanitarian-crisis',
    peopleAffected: 25_000_000,
    fundingGapUSD: 2_800_000_000,
    fundingReceivedUSD: 900_000_000,
    urgencyScore: 95,
    lastUpdated: '2024-11-01',
    criticalNeeds: ['Food', 'Water', 'Medical supplies', 'Shelter'],
    organizations: [
      { slug: 'save-the-children', name: 'Save the Children', donationUrl: 'https://www.savethechildren.org/us/what-we-do/emergency-response/sudan-crisis', volunteerUrl: 'https://www.savethechildren.org/us/about-us/volunteer' },
      { slug: 'doctors-without-borders', name: 'Doctors Without Borders', donationUrl: 'https://www.msf.org/donate', volunteerUrl: 'https://www.msf.org/work-with-us' },
      { slug: 'care', name: 'CARE International', donationUrl: 'https://www.care.org/our-work/disaster-response/emergencies/sudan-crisis/', volunteerUrl: 'https://www.care.org/get-involved/volunteer/' },
    ],
  },
  {
    id: 'curated-gaza-2024',
    name: 'Gaza Humanitarian Crisis',
    country: 'Palestine',
    slug: 'gaza-humanitarian-crisis',
    peopleAffected: 2_200_000,
    fundingGapUSD: 3_500_000_000,
    fundingReceivedUSD: 1_200_000_000,
    urgencyScore: 98,
    lastUpdated: '2024-11-01',
    criticalNeeds: ['Medical supplies', 'Food', 'Water', 'Fuel'],
    organizations: [
      { slug: 'unrwa', name: 'UNRWA', donationUrl: 'https://donate.unrwa.org/', volunteerUrl: 'https://www.unrwa.org/careers' },
      { slug: 'map', name: 'Medical Aid for Palestinians', donationUrl: 'https://www.map.org.uk/donate/', volunteerUrl: 'https://www.map.org.uk/get-involved/volunteer' },
    ],
  },
  {
    id: 'curated-afghanistan-2024',
    name: 'Afghanistan Humanitarian Crisis',
    country: 'Afghanistan',
    slug: 'afghanistan-humanitarian-crisis',
    peopleAffected: 23_700_000,
    fundingGapUSD: 2_100_000_000,
    fundingReceivedUSD: 600_000_000,
    urgencyScore: 88,
    lastUpdated: '2024-10-15',
    criticalNeeds: ['Food', 'Healthcare', 'Winter supplies', 'Education'],
    organizations: [
      { slug: 'wfp', name: 'World Food Programme', donationUrl: 'https://www.wfp.org/donate', volunteerUrl: 'https://www.wfp.org/careers/opportunities' },
      { slug: 'save-the-children', name: 'Save the Children', donationUrl: 'https://www.savethechildren.org/us/what-we-do/emergency-response/afghanistan', volunteerUrl: 'https://www.savethechildren.org/us/about-us/volunteer' },
    ],
  },
  {
    id: 'curated-ethiopia-2024',
    name: 'Ethiopia Drought & Conflict',
    country: 'Ethiopia',
    slug: 'ethiopia-drought-conflict',
    peopleAffected: 20_400_000,
    fundingGapUSD: 1_900_000_000,
    fundingReceivedUSD: 320_000_000,
    urgencyScore: 90,
    lastUpdated: '2024-10-01',
    criticalNeeds: ['Food', 'Water', 'Medical supplies'],
    organizations: [
      { slug: 'oxfam', name: 'Oxfam', donationUrl: 'https://www.oxfam.org/en/take-action/donate', volunteerUrl: 'https://www.oxfam.org/en/take-action/volunteer' },
      { slug: 'wfp', name: 'World Food Programme', donationUrl: 'https://www.wfp.org/donate', volunteerUrl: 'https://www.wfp.org/careers/opportunities' },
    ],
  },
  {
    id: 'curated-venezuela-2024',
    name: 'Venezuela Displacement Crisis',
    country: 'Venezuela',
    slug: 'venezuela-displacement-crisis',
    peopleAffected: 7_700_000,
    fundingGapUSD: 1_600_000_000,
    fundingReceivedUSD: 280_000_000,
    urgencyScore: 82,
    lastUpdated: '2024-09-20',
    criticalNeeds: ['Food', 'Medicine', 'Shelter', 'Cash assistance'],
    organizations: [
      { slug: 'unhcr', name: 'UNHCR', donationUrl: 'https://www.unhcr.org/donate/venezuela-emergency/', volunteerUrl: 'https://www.unhcr.org/get-involved' },
      { slug: 'mercy-corps', name: 'Mercy Corps', donationUrl: 'https://www.mercycorps.org/who-we-help/venezuela', volunteerUrl: 'https://www.mercycorps.org/volunteer' },
    ],
  },
];

// ─── GDACS ────────────────────────────────────────────────────────────────────

async function fetchGdacs() {
  console.log('📡 Fetching from GDACS...');
  try {
    const res = await fetch('https://www.gdacs.org/xml/rss.xml', {
      headers: { 'Accept': 'application/xml, text/xml' },
      signal: AbortSignal.timeout(15_000),
    });
    const xml = await res.text();
    const items = xml.split('<item>').slice(1).map(b => b.split('</item>')[0]);

    const crises = items
      .map(item => {
        const alertLevel = extractXml(item, 'alertlevel');
        if (!['Orange', 'Red'].includes(alertLevel)) return null;

        const title      = extractXml(item, 'title').replace(/<[^>]+>/g, '');
        const country    = extractXml(item, 'country') || extractAttr(item, 'country', 'name');
        const eventType  = extractXml(item, 'eventtype');
        const alertScore = parseFloat(extractAttr(item, 'alertscore', 'value') || extractXml(item, 'alertscore')) || 0;
        const popText    = extractXml(item, 'population') || extractAttr(item, 'population', 'value');
        const pubDate    = extractXml(item, 'pubDate');
        const eventId    = extractXml(item, 'eventid');

        if (!country || !title) return null;

        const peopleAffected = alertToPopulation(alertLevel, popText);
        const fundingPct     = alertLevel === 'Red' ? 20 : 30;
        const needed         = peopleAffected * 300;
        const received       = Math.round(needed * (fundingPct / 100));
        const lastUpdated    = pubDate
          ? new Date(pubDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);

        return {
          id:                 `gdacs-${eventType}-${eventId}`,
          name:               title.replace(/\([^)]*\)/g, '').replace(/,.*$/, '').trim().slice(0, 80),
          country,
          slug:               toSlug(title.slice(0, 60)),
          peopleAffected,
          fundingGapUSD:      needed - received,
          fundingReceivedUSD: received,
          urgencyScore:       urgencyFromAlert(alertLevel, alertScore, eventType),
          lastUpdated,
          criticalNeeds:      getCriticalNeeds(eventType, title),
          organizations: [
            { slug: 'ifrc', name: 'Red Cross / Red Crescent', donationUrl: 'https://www.ifrc.org/donate', volunteerUrl: 'https://www.ifrc.org/get-involved' },
            { slug: 'msf', name: 'Doctors Without Borders', donationUrl: 'https://www.msf.org/donate', volunteerUrl: 'https://www.msf.org/work-with-us' },
          ],
          resources: DISASTER_RESOURCES,
          source: `GDACS (${alertLevel} alert)`,
        };
      })
      .filter(Boolean);

    console.log(`✅ GDACS: ${crises.length} Orange/Red events`);
    return crises;
  } catch (err) {
    console.error('❌ GDACS fetch failed:', err.message);
    return [];
  }
}

// ─── every.org org enrichment ─────────────────────────────────────────────────
// Tries to find additional verified orgs via every.org for each curated crisis.
// Falls back to hardcoded orgs if API is unavailable.

async function enrichWithEveryOrg(crisis) {
  const query = `${crisis.country} ${crisis.criticalNeeds[0] || 'humanitarian'}`;
  const everyOrgs = await fetchEveryOrgOrgs(query, 'humanitarian,disaster-relief', 2);

  if (!everyOrgs || everyOrgs.length === 0) return crisis;

  // Merge: keep hardcoded orgs, append every.org orgs that aren't duplicates
  const existingSlugs = new Set(crisis.organizations.map(o => o.slug));
  const newOrgs = everyOrgs.filter(o => !existingSlugs.has(o.slug));

  return {
    ...crisis,
    organizations: [...crisis.organizations, ...newOrgs].slice(0, 5),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Updating crisis data...\n');

  // Fetch live natural disaster data
  const gdacsCrises = await fetchGdacs();

  // Enrich curated crises with every.org orgs + curated resources
  console.log('\n📡 Enriching humanitarian crises with every.org orgs...');
  const enriched = await Promise.all(
    HUMANITARIAN_CRISES.map(async crisis => {
      const withOrgs = await enrichWithEveryOrg(crisis);
      return {
        ...withOrgs,
        resources: CRISIS_RESOURCES[crisis.id] || [],
      };
    })
  );

  // Merge: curated humanitarian + live GDACS natural disasters
  // Skip GDACS entries for countries already in curated list
  const curatedCountries = new Set(HUMANITARIAN_CRISES.map(c => c.country.toLowerCase()));
  const newGdacs = gdacsCrises.filter(c => !curatedCountries.has(c.country.toLowerCase()));

  const all = [...enriched, ...newGdacs]
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 20);

  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(all, null, 2));

  const everyOrgCount = enriched.filter(c => c.organizations.length > (HUMANITARIAN_CRISES.find(h => h.id === c.id)?.organizations.length || 0)).length;
  console.log(`\n✅ Saved ${all.length} crises (${enriched.length} humanitarian + ${newGdacs.length} GDACS natural disasters)`);
  if (everyOrgCount > 0) console.log(`🔗 every.org enriched ${everyOrgCount} crises with additional orgs`);
  if (all[0]) console.log(`🔴 #1: ${all[0].name} (${all[0].country}) — urgency ${all[0].urgencyScore}/100`);
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
