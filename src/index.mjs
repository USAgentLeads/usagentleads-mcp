import { readFileSync } from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from './client.mjs';
const tools = JSON.parse(readFileSync(new URL('../tools.json', import.meta.url), 'utf8'));
const client = createClient();
const server = new Server({ name: 'usagentleads', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
  try { return { content: [{ type: 'text', text: JSON.stringify(await client(params.name, params.arguments)) }] }; }
  catch (error) { return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : 'Request failed' }] }; }
});
await server.connect(new StdioServerTransport());
