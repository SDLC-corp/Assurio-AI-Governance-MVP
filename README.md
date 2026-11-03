# Assurio — AI Governance & Assurance

A working, owner-private assurance application based on the capabilities described at https://sdlccorp.com/products/assurio/.

## Included workflows

- AI system registration with scope, ownership, risk tier, model, supplier, limits, and lifecycle status.
- Risk assessments with likelihood, impact, mitigation, and residual risk.
- Framework/control mappings and documented acceptance criteria.
- Evaluation results with server-computed pass/fail for minimum-value metrics; inconclusive findings are retained.
- Evidence records with provenance, expiry, revisions, file uploads, SHA-256 fingerprints, and downloads.
- Scoped decisions with approval gates for current evidence, failed/inconclusive evaluations, and open change reviews.
- Model/scope/limit changes and recorded change events invalidate linked evidence and flag decisions for reassessment.
- AI/ML component inventory, agent oversight records, integration contracts, and deployment policy profiles.
- Database-backed records, audit history with prior values, search, status filters, linked records, JSON audit exports.
- Optional illustrative sample workspace. Production starts empty; select “Load sample workspace” to explore.

## Architecture and access

React + TypeScript on Vinext, deployed as a Cloudflare Worker through Sites. D1 stores records and audit events. R2 stores evidence files. The hosted application relies on the owner-private Sites authentication boundary. Keep it private: the API is a shared-owner workspace and does not implement multi-tenant membership or independent enterprise RBAC.

Local preview binds only to 127.0.0.1 and is intended for a trusted developer machine. Do not expose the local server publicly.

## Run locally

Requires Node 22.13+.

1. Run npm ci.
2. Run npm run build.
3. Apply the initial migration once:
   node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_nervous_guardian.sql
4. Run npm start and open http://127.0.0.1:8787.

For source development use npm run dev. Local database and object storage live under ignored .wrangler/state. Hosted storage is separate.

## Validation

- npx tsc --noEmit
- npm run build
- node scripts/test-workflows.mjs (against the local running server; creates QA records)
- scripts/browser-qa.mjs uses an isolated Chrome DevTools session on port 9223 for desktop/mobile checks and captures ignored screenshots.

The integration checks cover required fields, approval gates, evaluation scoring, stale revisions, change invalidation, artifact upload/download/fingerprinting, cross-origin rejection, audit events, and sample loading.

## API contract

GET /api/records returns records and the latest 500 audit events.
POST /api/records creates a record with {kind, data}, or revises one with {id, revision, data}.
POST /api/records with {action:"seed"} loads missing sample records without replacing existing ones.
POST /api/artifacts accepts multipart fields id, revision, and file (maximum 10 MB).
GET /api/artifacts?id=<evidence-id> downloads the current artifact.

Use the authenticated hosted Site boundary. External integrations must obtain supported Sites service access; there is no public ingestion endpoint or embedded secret. Record kinds and accepted fields are defined in lib/modules.ts.

## Explicit limits

This is a functional application implementation, not a reproduction of undisclosed proprietary internals or a certified enterprise deployment.

- Integration entries are configuration/contract records, not live external connectors.
- Agent boundaries are documented controls; enforcement belongs in the actual agent runtime.
- Dedicated, edge, disconnected, retention and recovery profiles are planning records, not infrastructure provisioning.
- Multi-user role/attribute authorization, cryptographic artifact signing, WORM retention, scheduled telemetry ingestion, and automated test runners are not implemented.
- The audit ledger preserves history through the app API; it is not cryptographically immutable against database administrators.
- Approval checks are basic workflow gates, not legal compliance or safety determinations.
- Evidence is linked at system level for approval gates; assess relevance and completeness before approving.
- JSON audit exports contain the latest 500 events; all historical events remain in D1.
