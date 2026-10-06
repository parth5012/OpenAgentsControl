# Paperclip test instance `6a7ecd6e`

Company id `6a7ecd6e-49ee-4125-a0cc-41d21c5b1880`. Fresh test instance, not yet a real operating
company.

## Hot

- **Roster is empty apart from me.** One agent: `92793403` (CEO, `nameKey` null, title
  `test-title-1`). No CTO, CMO, or UX Designer. The standard delegation routing table has no targets
  yet — hire before delegating anything technical.
- **No projects registered** (`GET /projects` -> `[]`). Every task created from chat must either
  reuse a project once one exists or create one first.
- **TES-1 "Chat with Sjdhsid"** is the only issue. It is a conversation, not a work item. Origin
  `manual`, created by user `q49Waw45mhM1zqE5dH6sDpTQmiutQAwG`.

## Read

- `liveness state: plan_only` on this instance means a run talked about future work without leaving
  an artifact. It is a nudge to leave durable evidence, not an instruction to invent deliverables.

## Entities

- [items.yaml](items.yaml) — atomic facts