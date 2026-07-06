#!/usr/bin/env node

/**
 * Fetch real crisis data
 *
 * Sources:
 *   - GDACS RSS (gdacs.org) — live natural disasters, no API key needed
 *   - Curated humanitarian crises — conflict/famine/displacement (updated manually until ReliefWeb is approved)
 *
 * TODO: When ReliefWeb appname is approved, add it as RELIEFWEB_APPNAME env var
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

// ─── Curated humanitarian crises ─────────────────────────────────────────────
// These cover conflict/displacement/famine that GDACS doesn't track.
// Update urgencyScore, fundingGapUSD, fundingReceivedUSD, lastUpdated as needed.

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
      { slug: 'save-the-children', name: 'Save the Children', donationUrl: 'https://www.savethechildren.org/us/what-we-do/emergency-response/sudan-crisis' },
      { slug: 'doctors-without-borders', name: 'Doctors Without Borders', donationUrl: 'https://www.msf.org/donate' },
      { slug: 'care', name: 'CARE International', donationUrl: 'https://www.care.org/our-work/disaster-response/emergencies/sudan-crisis/' },
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
      { slug: 'unrwa', name: 'UNRWA', donationUrl: 'https://donate.unrwa.org/' },
      { slug: 'map', name: 'Medical Aid for Palestinians', donationUrl: 'https://www.map.org.uk/donate/' },
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
      { slug: 'wfp', name: 'World Food Programme', donationUrl: 'https://www.wfp.org/donate' },
      { slug: 'save-the-children', name: 'Save the Children', donationUrl: 'https://www.savethechildren.org/us/what-we-do/emergency-response/afghanistan' },
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
      { slug: 'oxfam', name: 'Oxfam', donationUrl: 'https://www.oxfam.org/en/take-action/donate' },
      { slug: 'wfp', name: 'World Food Programme', donationUrl: 'https://www.wfp.org/donate' },
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
      { slug: 'unhcr', name: 'UNHCR', donationUrl: 'https://www.unhcr.org/donate/venezuela-emergency/' },
      { slug: 'mercy-corps', name: 'Mercy Corps', donationUrl: 'https://www.mercycorps.org/who-we-help/venezuela' },
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

    // Split into <item> blocks
    const items = xml.split('<item>').slice(1).map(b => b.split('</item>')[0]);

    const crises = items
      .map(item => {
        const alertLevel = extractXml(item, 'alertlevel');
        if (!['Orange', 'Red'].includes(alertLevel)) return null; // skip minor events

        const title      = extractXml(item, 'title').replace(/<[^>]+>/g, '');
        const country    = extractXml(item, 'country') || extractAttr(item, 'country', 'name');
        const eventType  = extractXml(item, 'eventtype');
        const alertScore = parseFloat(extractAttr(item, 'alertscore', 'value') || extractXml(item, 'alertscore')) || 0;
        const popText    = extractXml(item, 'population') || extractAttr(item, 'population', 'value');
        const pubDate    = extractXml(item, 'pubDate');
        const link       = extractXml(item, 'link');
        const eventId    = extractXml(item, 'eventid');
        const severity   = extractXml(item, 'severity').replace(/<[^>]+>/g, '');

        if (!country || !title) return null;

        const peopleAffected = alertToPopulation(alertLevel, popText);
        const fundingPct     = alertLevel === 'Red' ? 20 : 30; // rough estimate for natural disasters
        const needed         = peopleAffected * 300;
        const received       = Math.round(needed * (fundingPct / 100));

        const lastUpdated = pubDate
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
            { slug: 'ifrc', name: 'Red Cross / Red Crescent', donationUrl: 'https://www.ifrc.org/donate' },
            { slug: 'msf', name: 'Doctors Without Borders', donationUrl: 'https://www.msf.org/donate' },
          ],
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Updating crisis data...\n');

  const gdacsCrises = await fetchGdacs();

  // Merge: curated humanitarian crises + live GDACS natural disasters
  // Deduplicate by country to avoid showing the same country twice
  const curatedCountries = new Set(HUMANITARIAN_CRISES.map(c => c.country.toLowerCase()));
  const newGdacs = gdacsCrises.filter(c => !curatedCountries.has(c.country.toLowerCase()));

  const all = [...HUMANITARIAN_CRISES, ...newGdacs]
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 20);

  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(all, null, 2));

  console.log(`\n✅ Saved ${all.length} crises (${HUMANITARIAN_CRISES.length} humanitarian + ${all.length - HUMANITARIAN_CRISES.length} GDACS natural disasters)`);
  if (all[0]) console.log(`🔴 #1: ${all[0].name} (${all[0].country}) — urgency ${all[0].urgencyScore}/100`);
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
