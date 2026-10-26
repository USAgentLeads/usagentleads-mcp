export function createClient({ key = process.env.USAGENTLEADS_API_KEY, baseUrl = process.env.USAGENTLEADS_BASE_URL || 'https://www.usagentleads.com', fetchImpl = fetch } = {}) {
  const origin = new URL(baseUrl);
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') throw new Error('Use an origin without credentials or paths');
  if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) throw new Error('HTTPS required');
  const paths = { coverage: ['GET', 'coverage'], count_records: ['POST', 'search/count'], preview_records: ['POST', 'search/preview'], owned_records: ['GET', 'records'], credit_balance: ['GET', 'credits'], unlock_records: ['POST', 'records/unlock'] };
  return async (name, args = {}) => {
    if (!key) throw new Error('Set USAGENTLEADS_API_KEY');
    if (name === 'unlock_records' && (args.confirmCreditSpend !== true || !args.idempotencyKey || !Number.isInteger(args.maxCredits) || args.maxCredits < 1)) throw new Error('Confirm the selection, maxCredits and a saved UUID idempotencyKey before spending');
    if (name === 'create_export') {
      if (!['agents', 'brokerages'].includes(args.kind)) throw new Error('Choose agents or brokerages');
      const query = new URLSearchParams(Object.entries(args).filter(([key]) => ['kind', 'template', 'list'].includes(key)));
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
