# USAgentLeads MCP

The hosted endpoint is `https://www.usagentleads.com/api/mcp`. Growth and Pro include REST v3 and hosted MCP. The v3 backend is deployed; existing v2 calls remain supported.

Configure Streamable HTTP with an Authorization bearer header from a protected environment variable. OAuth is not included. Never put credentials in a URL or shared prompt.

For the local stdio bridge:

```sh
npm ci
export USAGENTLEADS_API_KEY='your-key'
npm start
```

Configure your client to launch `node /absolute/path/usagentleads-mcp/src/index.mjs` and provide the key through its environment.

New audience-specific tools return contacts directly: search_agents, search_brokerages, lookup_agents and lookup_brokerages. Count/preview tools, get_account, get_usage, search_locations and get_request spend no record credits. create_contact_export queues new or owned records; export_status, export_download and cancel_export manage the job.

Billable tools require max_credits, a saved UUID idempotency_key and confirm_credit_spend:true. Obtain authorization for the selection and cap first. New agents cost 1 credit and brokerages 2; repeat ownership is free across dashboard, REST and MCP. A timeout is not permission to use a new key.

Export download returns an authenticated URL without credentials. REST and hosted MCP share 60 requests/minute/account and monthly quotas. Results are recoverable for 30 days; cursors last 24 hours.

Legacy tools remain available, including owned_records, unlock_records and create_export. Their v2 request contracts remain unchanged; legacy unlock remains Pro-only.

Run `npm test` for offline client/protocol checks. The app's `bun scripts/generate-api-v3-docs.mjs` synchronizes tools.json with hosted MCP schemas.

Documentation: https://www.usagentleads.com/docs. MIT covers client code, not the licensed dataset.
