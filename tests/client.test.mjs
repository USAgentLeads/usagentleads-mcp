import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../src/client.mjs';
test('removed tools are rejected before network access', async () => {
  let calls=0;
  const client=createClient({key:'synthetic-key',fetchImpl:()=>{calls++;throw Error('Unexpected network');}});
  for(const name of ['coverage','count_records','preview_records','owned_records','credit_balance','unlock_records','create_export'])
    await assert.rejects(client(name,{}),/Unknown tool/);
  assert.equal(calls,0);
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
