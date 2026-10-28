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
    assert.equal(tools.length, 23);
    const unlock = tools.find(t => t.name === 'unlock_records');
    assert.equal(unlock.annotations.destructiveHint, true);
    assert(unlock.inputSchema.required.includes('confirmCreditSpend'));
    const result = await client.callTool({name:'unlock_records',arguments:{kind:'agents'}});
    assert.equal(result.isError, true);
  } finally { await client.close(); }
});
