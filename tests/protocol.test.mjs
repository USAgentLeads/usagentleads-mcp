import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
test('stdio server initializes and advertises safe tool contracts without network access', async () => {
  const transport = new StdioClientTransport({ command: process.execPath, args: ['src/index.mjs'], env: { PATH: process.env.PATH, USAGENTLEADS_API_KEY: 'synthetic-test-key' } });
  const client = new Client({ name: 'protocol-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 16);
    const search = tools.find(t => t.name === 'search_agents');
    assert.equal(search.annotations.destructiveHint, true);
    assert(search.inputSchema.required.includes('confirm_credit_spend'));
    const result = await client.callTool({name:'search_agents',arguments:{max_credits:1}});
    assert.equal(result.isError, true);
  } finally { await client.close(); }
});
