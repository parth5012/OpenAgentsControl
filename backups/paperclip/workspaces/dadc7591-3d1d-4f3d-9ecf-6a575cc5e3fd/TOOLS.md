# Tools

## Paperclip control-plane API

- Base: `$PAPERCLIP_API_URL` (e.g. `http://100.87.250.35:3100`)
- Auth: `Authorization: Bearer $PAPERCLIP_API_KEY` on every request.
- **Mutating calls must include** `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID`.
- Useful reads:
  - `GET /api/agents/me` -- own id, role, permissions, adapter config.
  - `GET /api/companies/$PAPERCLIP_COMPANY_ID/agents` -- roster.
  - `GET /api/companies/$PAPERCLIP_COMPANY_ID/projects` -- project list.
  - `GET /api/issues/$PAPERCLIP_TASK_ID` and `/comments` -- current issue state.
- Mutations: `POST /api/issues/{id}/checkout`, `POST /api/issues/{id}/comments`,
  `POST /api/companies/{companyId}/issues`, `PUT /api/issues/{id}/documents/plan`.
- `checkoutRunId` on the issue tells me whether a run already owns it. If the harness
  claimed it, do not check out again -- you will get a 409.

## Runtime tools exposed to me

`connections_search`, `connection_request`. Nothing else. Anything else is raw HTTP.

## Gotchas learned

- Never retry a 409 on checkout; that issue belongs to another run.
- After 2 consecutive failures of the same control-plane write, stop and report honestly.