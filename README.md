# usagentleads-mcp

Official USAgentLeads developer resources. Documentation: https://www.usagentleads.com/docs.

**Release status:** API v2 and hosted MCP are implemented for the next application release. The application deployment is intentionally pending UI review. Public documentation and clients do not imply that those endpoints are already live. Existing one-time purchases and legacy v1 access continue unchanged.

Never commit an API key or real contact data. Use synthetic records in examples and tests. API access requires Growth (read) or Pro (read, unlock, MCP). Legacy Pro API retains v1 access and gains v2 read access.

Search and masked previews spend no record credits. One agent unlock costs one credit; a brokerage costs two. Unlocks share the dashboard balance. Reuse the same UUID idempotency key and identical payload after a timeout. Do not create another key until the prior outcome is resolved.

Licensed under MIT. This license covers client code and documentation, not the licensed contact dataset.

## Hosted transport

Connect a Streamable HTTP client to `https://www.usagentleads.com/api/mcp`, with `Authorization: Bearer <API key>`. Pro is required. OAuth is not part of this release. Use a client that supports bearer headers; store the key outside version control.

## Local stdio server

```sh
npm ci
export USAGENTLEADS_API_KEY='your-key'
npm start
```

Configure your client to run `node /absolute/path/usagentleads-mcp/src/index.mjs` and supply the key through its environment. The bridge calls the REST API; REST plan restrictions are enforced on each request. Tools are defined in `tools.json`.

`unlock_records` requires approval for the selection and maximum credits, `confirmCreditSpend: true`, and a saved UUID idempotency key. Reuse the same key and payload on retries. Tool annotations are client hints, not proof of approval. `create_export` prepares a credential-free URL; downloading it with your bearer key generates the suppression-aware CSV and audit record.

Run `npm test` for offline safety checks.
