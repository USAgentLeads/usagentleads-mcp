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

const id='aa80a81a-f7c1-4c45-8b70-64c25e7143d2';
test('v3 search sends the saved key as a header and permits zero-credit access', async()=>{
  let captured;
  const client=createClient({key:'secret',fetchImpl:async(url,init)=>{captured={url,init};return Response.json({records:[]});}});
  await client('search_brokerages',{filters:{state:'CA'},max_credits:0,idempotency_key:id,confirm_credit_spend:true});
  assert.equal(captured.url.pathname,'/api/v3/brokerages/search');
  assert.equal(captured.init.headers['Idempotency-Key'],id);
  assert.equal(captured.init.redirect,'error');
  const body=JSON.parse(captured.init.body);
  assert.equal(body.max_credits,0);
  assert(!('confirm_credit_spend' in body));assert(!('idempotency_key' in body));
});
test('v3 rejects unapproved spending and invalid recovery IDs before network access',async()=>{
  const client=createClient({key:'secret',fetchImpl:()=>{throw Error('Unexpected network');}});
  await assert.rejects(client('search_agents',{max_credits:1,idempotency_key:id}),/Confirm/);
  await assert.rejects(client('get_request',{request_id:'../account'}),/UUID/);
});
test('v3 exports return only same-origin credential-free download URLs',async()=>{
  const client=createClient({key:'secret',fetchImpl:async()=>Response.json({status:'ready',download_url:'https://attacker.test/secret'})});
  const result=await client('export_download',{export_id:id});
  assert.equal(result.download_url,'https://www.usagentleads.com/api/v3/exports/'+id+'/download');
  assert(!JSON.stringify(result).includes('secret'));
});
test('v3 preserves retry guidance and performs no automatic paid retry',async()=>{
  let calls=0;
  const client=createClient({key:'secret',fetchImpl:async()=>{calls++;return new Response(null,{status:429,headers:{'Retry-After':'60'}});}});
  await assert.rejects(client('lookup_agents',{ids:['a'],max_credits:1,idempotency_key:id,confirm_credit_spend:true}),/Retry-After: 60/);
  assert.equal(calls,1);
});
