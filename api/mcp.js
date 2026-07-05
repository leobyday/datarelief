import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(process.cwd(), 'data', 'crises.json');
const BASE_URL = process.env.DATARELIEF_BASE_URL || 'https://datarelief.org';

function loadCrises() {
  return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
}

function fundingGapPct(crisis) {
  const total = crisis.fundingGapUSD + crisis.fundingReceivedUSD;
  return total > 0 ? Math.round((crisis.fundingGapUSD / total) * 100) : 0;
}

function isStale(lastUpdated) {
  const days = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  return days > 30;
}

function redirectUrl(crisisSlug, orgSlug) {
  return `${BASE_URL}/api/go/${crisisSlug}/${orgSlug}`;
}

// ─── ASCII visualization helpers ─────────────────────────────────────────────

const FULL = '█';
const EMPTY = '░';
const BAR_WIDTH = 20;

function bar(value, max, width = BAR_WIDTH) {
  const filled = Math.round((value / max) * width);
  return FULL.repeat(filled) + EMPTY.repeat(width - filled);
}

function urgencyBar(score) {
  return `${bar(score, 100)} ${score}/100`;
}

function fundingBar(crisis) {
  const total = crisis.fundingGapUSD + crisis.fundingReceivedUSD;
  const fundedPct = total > 0 ? Math.round((crisis.fundingReceivedUSD / total) * 100) : 0;
  const gapPct = 100 - fundedPct;
  return `Funded  ${bar(fundedPct, 100)} ${fundedPct}%\nGap     ${bar(gapPct, 100)} ${gapPct}%`;
}

function needsBar(crisis) {
  // Each need gets equal weight across the bar — shows breadth of crisis
  const needs = crisis.criticalNeeds;
  const perNeed = Math.floor(BAR_WIDTH / needs.length);
  return needs.map(n => `${FULL.repeat(perNeed)} ${n}`).join('  ');
}

function formatCrisisCard(crisis, rank) {
  const gapM = Math.round(crisis.fundingGapUSD / 1_000_000);
  const affected = crisis.peopleAffected.toLocaleString();
  const stale = isStale(crisis.lastUpdated) ? `⚠️  Data as of ${crisis.lastUpdated}\n` : `Updated ${crisis.lastUpdated}\n`;
  const rankPrefix = rank != null ? `${rank}. ` : '';
  const orgLinks = crisis.organizations.map(o => `[${o.name} →](${redirectUrl(crisis.slug, o.slug)})`).join(' · ');

  return `**${rankPrefix}${crisis.name}** — ${crisis.country}
${stale}
Urgency  ${urgencyBar(crisis.urgencyScore)}
${fundingBar(crisis)}

People affected: ${affected}
Funding gap:     $${gapM}M
Areas of need:   ${needsBar(crisis)}

Donate: ${orgLinks}`;
}

function shortName(crisis) {
  return crisis.name
    .replace(' Humanitarian Crisis', '')
    .replace(' Humanitarian', '')
    .replace(' Displacement Crisis', '')
    .replace(' Drought & Conflict', '')
    .replace(' Crisis', '')
    .slice(0, 24);
}

function formatRankingChart(crises) {
  const maxLen = Math.max(...crises.map(c => shortName(c).length));

  const lines = crises.map((c, i) => {
    const rank = `${i + 1}.`.padEnd(3);
    const name = shortName(c).padEnd(maxLen);
    return `${rank} ${name}  ${bar(c.urgencyScore, 100)}  ${c.urgencyScore}`;
  });

  const width = 3 + 1 + maxLen + 2 + BAR_WIDTH + 2 + 3;
  return `\`\`\`
${'─'.repeat(width)}
${lines.join('\n')}
${'─'.repeat(width)}
\`\`\``;
}

function logQuery(query, crisesReturned) {
  console.log(JSON.stringify({
    type: 'mcp_query',
    timestamp: new Date().toISOString(),
    query,
    crisesReturned,
    source: 'claude-mcp',
  }));
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

function createMcpServer() {
  const server = new Server(
    { name: 'datarelief', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_crises',
        description: 'List active global crises ranked by urgency with visual charts. Use for "who needs help?", "where should I donate?", "what crises are happening?"',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max crises to return (default: 7)' },
          },
        },
      },
      {
        name: 'get_crisis',
        description: 'Get detailed info about a specific crisis. Use the slug from list_crises (e.g. "sudan-2024")',
        inputSchema: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string' },
          },
        },
      },
      {
        name: 'compare_crises',
        description: 'Compare crises side by side with visual urgency bars',
        inputSchema: {
          type: 'object',
          required: ['slugs'],
          properties: {
            slugs: { type: 'array', items: { type: 'string' }, description: 'e.g. ["sudan-2024","gaza-2024"]' },
          },
        },
      },
      {
        name: 'filter_crises',
        description: 'Filter crises by country, need type (e.g. "food", "medical"), or minimum urgency score',
        inputSchema: {
          type: 'object',
          properties: {
            country:    { type: 'string' },
            need:       { type: 'string' },
            minUrgency: { type: 'number' },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const crises = loadCrises();

    if (name === 'list_crises') {
      const limit = args?.limit || 7;
      const ranked = [...crises].sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, limit);
      logQuery('list_crises', ranked.map(c => c.slug));

      const chart = formatRankingChart(ranked);
      const cards = ranked.map((c, i) => formatCrisisCard(c, i + 1)).join('\n\n---\n\n');

      return {
        content: [{
          type: 'text',
          text: `## 🌍 Active Global Crises\n\n${chart}\n\n---\n\n${cards}\n\n---\n*DataRelief — the data layer for humanitarian relief*`,
        }],
      };
    }

    if (name === 'get_crisis') {
      const crisis = crises.find(c => c.slug === args?.slug || c.id === args?.slug);
      if (!crisis) return {
        content: [{ type: 'text', text: `No crisis found with slug "${args?.slug}". Try list_crises to see available crises.` }],
        isError: true,
      };
      logQuery(`get_crisis:${args.slug}`, [crisis.slug]);
      return { content: [{ type: 'text', text: formatCrisisCard(crisis) }] };
    }

    if (name === 'compare_crises') {
      const found = (args?.slugs || []).map(s => crises.find(c => c.slug === s || c.id === s)).filter(Boolean);
      if (!found.length) return {
        content: [{ type: 'text', text: 'No matching crises found. Try list_crises to see available slugs.' }],
        isError: true,
      };
      logQuery(`compare:${args.slugs.join(',')}`, found.map(c => c.slug));

      const chart = formatRankingChart(found);
      const cards = found.map(c => formatCrisisCard(c)).join('\n\n---\n\n');
      return {
        content: [{ type: 'text', text: `## Crisis Comparison\n\n${chart}\n\n---\n\n${cards}` }],
      };
    }

    if (name === 'filter_crises') {
      let filtered = [...crises];
      if (args?.country)    filtered = filtered.filter(c => c.country.toLowerCase().includes(args.country.toLowerCase()));
      if (args?.need)       filtered = filtered.filter(c => c.criticalNeeds.some(n => n.toLowerCase().includes(args.need.toLowerCase())));
      if (args?.minUrgency) filtered = filtered.filter(c => c.urgencyScore >= args.minUrgency);
      filtered.sort((a, b) => b.urgencyScore - a.urgencyScore);
      logQuery(`filter:${JSON.stringify(args)}`, filtered.map(c => c.slug));

      if (!filtered.length) return {
        content: [{ type: 'text', text: 'No crises match your filter. Try list_crises to see all active crises.' }],
      };

      const chart = formatRankingChart(filtered);
      const cards = filtered.map((c, i) => formatCrisisCard(c, i + 1)).join('\n\n---\n\n');
      return { content: [{ type: 'text', text: `## Filtered Crises\n\n${chart}\n\n---\n\n${cards}` }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  });

  return server;
}

export default async function handler(req, res) {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on('close', () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }

  await transport.handleRequest(req, res, body);
}
