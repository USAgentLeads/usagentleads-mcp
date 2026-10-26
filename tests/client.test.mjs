import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../src/client.mjs';
test('unlock requires explicit confirmation before network activity', async () => {
  const client = createClient({ key: 'test', fetchImpl: () => { throw new Error('Network should not run'); } });
  await assert.rejects(client('unlock_records', { maxCredits: 1 }), /Confirm/);
});
test('request preserves the idempotency key and refuses redirects', async () => {
  let request;
  const client = createClient({ key: 'test', fetchImpl: async (url, init) => { request = init; return Response.json({ ok: true }); } });
  await client('unlock_records', { kind: 'agents', maxCredits: 1, idempotencyKey: 'test-key', confirmCreditSpend: true });
  assert.equal(JSON.parse(request.body).idempotencyKey, 'test-key');
  assert.equal(request.redirect, 'error');
});
test('export URLs never contain credentials', async () => {
  const result = await createClient({ key: 'secret' })('create_export', { kind: 'agents', key: 'secret' });
  assert.equal(result.url, 'https://www.usagentleads.com/api/v2/exports?kind=agents');
});
