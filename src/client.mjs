export function createClient({ key = process.env.USAGENTLEADS_API_KEY, baseUrl = process.env.USAGENTLEADS_BASE_URL || 'https://www.usagentleads.com', fetchImpl = fetch } = {}) {
  const origin = new URL(baseUrl);
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') throw new Error('Use an origin without credentials or paths');
  if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) throw new Error('HTTPS required');
  const paths = { coverage: ['GET', 'coverage'], count_records: ['POST', 'search/count'], preview_records: ['POST', 'search/preview'], owned_records: ['GET', 'records'], credit_balance: ['GET', 'credits'], unlock_records: ['POST', 'records/unlock'] };
  return async (name, args = {}) => {
    if (!key) throw new Error('Set USAGENTLEADS_API_KEY');

    const audienceTool = /^(search|lookup|count|preview)_(agents|brokerages)$/.exec(name);
    const sharedV3 = { get_account:['GET','account'], get_usage:['GET','usage'], get_request:['GET','requests'], search_locations:['GET','locations'], create_contact_export:['POST','exports'], export_status:['GET','exports'], export_download:['GET','exports'], cancel_export:['POST','exports'] };
    if (audienceTool || sharedV3[name]) {
      const billable = name === 'create_contact_export' || (audienceTool && ['search','lookup'].includes(audienceTool[1]));
      const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
      if (billable && (args.confirm_credit_spend !== true || !uuid(args.idempotency_key) || !Number.isInteger(args.max_credits) || args.max_credits < 0))
        throw new Error('Confirm the selection, max_credits and a saved UUID idempotency_key before spending');
      let [method, route] = audienceTool ? ['POST', audienceTool[2]+'/'+audienceTool[1]] : sharedV3[name];
      if (name === 'get_request') {
        if (!uuid(args.request_id)) throw new Error('Provide a UUID request_id');
        route += '/'+args.request_id;
      }
      if (['export_status','export_download','cancel_export'].includes(name)) {
        if (!uuid(args.export_id)) throw new Error('Provide a UUID export_id');
        route += '/'+args.export_id+(name === 'cancel_export' ? '/cancel' : '');
      }
      const url = new URL('/api/v3/'+route, origin);
      if (name === 'search_locations') for (const [k,v] of Object.entries(args)) url.searchParams.set(k,String(v));
      const body = {...args};
      delete body.confirm_credit_spend; delete body.idempotency_key;
      if (name === 'cancel_export') delete body.export_id;
      const headers = { Authorization: 'Bearer '+key, 'Content-Type':'application/json' };
      if (billable) headers['Idempotency-Key'] = args.idempotency_key;
      const response = await fetchImpl(url,{method,redirect:'error',signal:AbortSignal.timeout(60000),headers,...(method==='POST'?{body:JSON.stringify(body)}:{})});
      if (!response.ok) throw new Error('API returned HTTP '+response.status+'; Retry-After: '+(response.headers.get('Retry-After') || 'not provided')+'. Preserve the SAME idempotency key and payload.');
      const result = await response.json();
      if (name === 'export_download') return {...result,download_url: result.status === 'ready' ? origin.origin+'/api/v3/exports/'+args.export_id+'/download' : null,authentication:'Authorization: Bearer <your API key>'};
      return result;
    }
    if (name === 'unlock_records' && (args.confirmCreditSpend !== true || !args.idempotencyKey || !Number.isInteger(args.maxCredits) || args.maxCredits < 1)) throw new Error('Confirm the selection, maxCredits and a saved UUID idempotencyKey before spending');
    if (name === 'create_export') {
      if (!['agents', 'brokerages'].includes(args.kind)) throw new Error('Choose agents or brokerages');
      const query = new URLSearchParams(Object.entries(args).filter(([key]) => ['kind', 'template', 'list', 'q'].includes(key)));
      return { url: `${origin.origin}/api/v2/exports?${query}`, method: 'GET', authentication: 'Authorization: Bearer <your API key>', status: 'download_request_prepared' };
    }
    const operation = paths[name];
    if (!operation) throw new Error('Unknown tool');
    const [method, path] = operation;
    const url = new URL(`/api/v2/${path}`, origin);
    if (method === 'GET') for (const [k, value] of Object.entries(args)) url.searchParams.set(k, String(value));
    const body = { ...args };
    delete body.confirmCreditSpend;
    const response = await fetchImpl(url, { method, redirect: 'error', signal: AbortSignal.timeout(60000), headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
    if (!response.ok) throw new Error(`API returned HTTP ${response.status}; preserve the same unlock key and payload on retries.`);
    return response.json();
  };
}
