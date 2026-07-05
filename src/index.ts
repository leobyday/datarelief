import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Crisis } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'crises.json');
const BASE_URL = process.env.DATARELIEF_BASE_URL || 'https://datarelief.org';

function loadCrises(): Crisis[] {
  return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
}

function fundingGapPct(crisis: Crisis): number {
  const total = crisis.fundingGapUSD + crisis.fundingReceivedUSD;
  return total > 0 ? Math.round((crisis.fundingGapUSD / total) * 100) : 0;
}

function isStale(lastUpdated: string): boolean {
  const days = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  return days > 30;
}

function staleWarning(crisis: Crisis): string {
  return isStale(crisis.lastUpdated)
    ? `\n> ⚠️ Data last updated ${crisis.lastUpdated}. Figures may have changed.\n`
    : '';
}

function redirectUrl(crisisSlug: string, orgSlug: string): string {
  return `${BASE_URL}/api/go/${crisisSlug}/${orgSlug}`;
}

function formatCrisisSummary(crisis: Crisis, rank?: number): string {
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

function logQuery(query: string, crisesReturned: string[]): void {
  process.stderr.write(JSON.stringify({
    type: 'mcp_query',
    timestamp: new Date().toISOString(),
    query,
    crisesReturned,
    source: 'claude-mcp',
  }) + '\n');
}

const server = new Server(
  { name: 'datarelief', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_crises',
      description: 'List all active global crises ranked by urgency and funding gap. Use this to answer "who needs help in the world?" or "where should I donate?"',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Max crises to return (default: all)',
          },
        },
      },
    },
    {
      name: 'get_crisis',
      description: 'Get detailed information about a specific crisis by its slug (e.g. "sudan-2024")',
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
            description: 'Array of crisis slugs to compare, e.g. ["sudan-2024", "gaza-2024"]',
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
          need: { type: 'string', description: 'Filter by need type, e.g. "medical" or "food"' },
          minUrgency: { type: 'number', description: 'Minimum urgency score (0-100)' },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const crises = loadCrises();

  if (name === 'list_crises') {
    const limit = (args?.limit as number) || crises.length;
    const ranked = [...crises]
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, limit);

    logQuery('list_crises', ranked.map(c => c.slug));

    const body = ranked.map((c, i) => formatCrisisSummary(c, i + 1)).join('\n\n---\n\n');
    return {
      content: [{
        type: 'text',
        text: `## Active Global Crises — Ranked by Urgency\n\n${body}\n\n---\n*Data sourced by DataRelief. Click any donate link to contribute.*`,
      }],
    };
  }

  if (name === 'get_crisis') {
    const slug = args?.slug as string;
    const crisis = crises.find(c => c.slug === slug || c.id === slug);

    if (!crisis) {
      return {
        content: [{ type: 'text', text: `No crisis found with slug "${slug}". Try list_crises to see available crises.` }],
        isError: true,
      };
    }

    logQuery(`get_crisis:${slug}`, [crisis.slug]);

    return {
      content: [{ type: 'text', text: formatCrisisSummary(crisis) }],
    };
  }

  if (name === 'compare_crises') {
    const slugs = args?.slugs as string[];
    const found = slugs.map(s => crises.find(c => c.slug === s || c.id === s)).filter(Boolean) as Crisis[];

    if (found.length === 0) {
      return {
        content: [{ type: 'text', text: 'No matching crises found. Try list_crises to see available slugs.' }],
        isError: true,
      };
    }

    logQuery(`compare_crises:${slugs.join(',')}`, found.map(c => c.slug));

    const header = '| Crisis | Country | Urgency | Funding Gap | People Affected | Last Updated |\n|---|---|---|---|---|---|';
    const rows = found.map(c =>
      `| **${c.name}** | ${c.country} | ${c.urgencyScore}/100 | $${Math.round(c.fundingGapUSD / 1_000_000)}M (${fundingGapPct(c)}%) | ${c.peopleAffected.toLocaleString()} | ${c.lastUpdated} |`
    );

    const details = found.map(c => formatCrisisSummary(c)).join('\n\n---\n\n');
    return {
      content: [{
        type: 'text',
        text: `## Crisis Comparison\n\n${header}\n${rows.join('\n')}\n\n---\n\n${details}`,
      }],
    };
  }

  if (name === 'filter_crises') {
    const { country, need, minUrgency } = args as { country?: string; need?: string; minUrgency?: number };

    let filtered = [...crises];
    if (country) filtered = filtered.filter(c => c.country.toLowerCase().includes(country.toLowerCase()));
    if (need) filtered = filtered.filter(c => c.criticalNeeds.some(n => n.toLowerCase().includes(need.toLowerCase())));
    if (minUrgency) filtered = filtered.filter(c => c.urgencyScore >= minUrgency);

    filtered.sort((a, b) => b.urgencyScore - a.urgencyScore);

    logQuery(`filter_crises:${JSON.stringify({ country, need, minUrgency })}`, filtered.map(c => c.slug));

    if (filtered.length === 0) {
      return {
        content: [{ type: 'text', text: 'No crises match your filter. Try list_crises to see all active crises.' }],
      };
    }

    const body = filtered.map((c, i) => formatCrisisSummary(c, i + 1)).join('\n\n---\n\n');
    return {
      content: [{ type: 'text', text: `## Filtered Crises\n\n${body}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('DataRelief MCP server running\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
