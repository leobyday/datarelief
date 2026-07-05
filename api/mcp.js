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

function staleWarning(crisis) {
  return isStale(crisis.lastUpdated)
    ? `\n> ⚠️ Data last updated ${crisis.lastUpdated}. Figures may have changed.\n`
    : '';
}

function redirectUrl(crisisSlug, orgSlug) {
  return `${BASE_URL}/api/go/${crisisSlug}/${orgSlug}`;
}

function formatCrisis(crisis, rank) {
  const gap = fundingGapPct(crisis);
  const gapM = Math.round(crisis.fundingGapUSD / 1_000_000);
  const affected = crisis.peopleAffected.toLocaleString();
  const prefix = rank != null ? `**${rank}. ${crisis.name}**` : `**${crisis.name}**`;

  const orgLinks = crisis.organizations
    .map(o => `[${o.name} →](${redirectUrl(crisis.slug, o.slug)})`)
    .join(' · ');

  return `${prefix} — ${crisis.country}
${staleWarning(crisis)}- People affected: ${affected} (as of ${crisis.lastUpdated})
- Funding gap: $${gapM}M · ${gap}% underfunded
- Urgency score: ${crisis.urgencyScore}/100
- Critical needs: ${crisis.criticalNeeds.join(', ')}
- Donate: ${orgLinks}`;
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

function createMcpServer() {
  const server = new Server(
    { name: 'datarelief', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_crises',
        description: 'List all active global crises ranked by urgency and funding gap. Use for "who needs help?", "where should I donate?", "what crises are happening?"',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max crises to return (default: all)' },
          },
        },
      },
      {
        name: 'get_crisis',
        description: 'Get detailed info about a specific crisis by its slug (e.g. "sudan-2024")',
        inputSchema: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string', description: 'Crisis slug, e.g. "sudan-2024"' },
          },
        },
      },
      {
        name: 'compare_crises',
        description: 'Compare two or more crises side by side — funding gaps, urgency, people affected',
        inputSchema: {
          type: 'object',
          required: ['slugs'],
          properties: {
            slugs: {
              type: 'array',
              items: { type: 'string' },
              description: 'Crisis slugs to compare, e.g. ["sudan-2024", "gaza-2024"]',
            },
          },
        },
      },
      {
        name: 'filter_crises',
        description: 'Filter crises by country, need type, or minimum urgency score',
        inputSchema: {
          type: 'object',
          properties: {
            country: { type: 'string', description: 'Filter by country name' },
            need: { type: 'string', description: 'Need type, e.g. "medical" or "food"' },
            minUrgency: { type: 'number', description: 'Minimum urgency score 0-100' },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const crises = loadCrises();

    if (name === 'list_crises') {
      const limit = args?.limit || crises.length;
      const ranked = [...crises].sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, limit);
      logQuery('list_crises', ranked.map(c => c.slug));
      const body = ranked.map((c, i) => formatCrisis(c, i + 1)).join('\n\n---\n\n');
      return {
        content: [{ type: 'text', text: `## Active Global Crises — Ranked by Urgency\n\n${body}\n\n---\n*Data sourced by DataRelief. Click any donate link to contribute.*` }],
      };
    }

    if (name === 'get_crisis') {
      const crisis = crises.find(c => c.slug === args?.slug || c.id === args?.slug);
      if (!crisis) return { content: [{ type: 'text', text: `No crisis found with slug "${args?.slug}". Try list_crises to see available crises.` }], isError: true };
      logQuery(`get_crisis:${args.slug}`, [crisis.slug]);
      return { content: [{ type: 'text', text: formatCrisis(crisis) }] };
    }

    if (name === 'compare_crises') {
      const found = (args?.slugs || []).map(s => crises.find(c => c.slug === s || c.id === s)).filter(Boolean);
      if (!found.length) return { content: [{ type: 'text', text: 'No matching crises found. Try list_crises to see available slugs.' }], isError: true };
      logQuery(`compare:${args.slugs.join(',')}`, found.map(c => c.slug));
      const header = '| Crisis | Country | Urgency | Funding Gap | People Affected | Last Updated |\n|---|---|---|---|---|---|';
      const rows = found.map(c => `| **${c.name}** | ${c.country} | ${c.urgencyScore}/100 | $${Math.round(c.fundingGapUSD / 1_000_000)}M (${fundingGapPct(c)}%) | ${c.peopleAffected.toLocaleString()} | ${c.lastUpdated} |`);
      const details = found.map(c => formatCrisis(c)).join('\n\n---\n\n');
      return { content: [{ type: 'text', text: `## Crisis Comparison\n\n${header}\n${rows.join('\n')}\n\n---\n\n${details}` }] };
    }

    if (name === 'filter_crises') {
      let filtered = [...crises];
      if (args?.country) filtered = filtered.filter(c => c.country.toLowerCase().includes(args.country.toLowerCase()));
      if (args?.need) filtered = filtered.filter(c => c.criticalNeeds.some(n => n.toLowerCase().includes(args.need.toLowerCase())));
      if (args?.minUrgency) filtered = filtered.filter(c => c.urgencyScore >= args.minUrgency);
      filtered.sort((a, b) => b.urgencyScore - a.urgencyScore);
      logQuery(`filter:${JSON.stringify(args)}`, filtered.map(c => c.slug));
      if (!filtered.length) return { content: [{ type: 'text', text: 'No crises match your filter. Try list_crises to see all active crises.' }] };
      const body = filtered.map((c, i) => formatCrisis(c, i + 1)).join('\n\n---\n\n');
      return { content: [{ type: 'text', text: `## Filtered Crises\n\n${body}` }] };
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
