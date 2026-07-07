
n8n is out. Aikido + Sentry only.

## 1. Secrets to add (build mode will prompt)

- `AIKIDO_CLIENT_ID` + `AIKIDO_CLIENT_SECRET` — Aikido → Settings → Integrations → REST API
- `SENTRY_AUTH_TOKEN` — Sentry User Auth Token (`event:read`, `project:read`, `org:read`)
- `SENTRY_ORG_SLUG` — your Sentry org slug

`SENDGRID_API_KEY` is already set. Each panel shows a friendly "not connected" state until its credentials exist.

## 2. Security panel: Wiz → Aikido

- Rename edge function `ingest-wiz-findings` → `ingest-aikido-findings`. OAuth2 client-credentials → `GET /api/public/v1/issues/export`. Rows still land in existing `security_findings` table (schema unchanged).
- `SecurityPanel.tsx`: "Sync Wiz" → "Sync Aikido", connector labels updated, setup link → Aikido docs.
- `supabase/config.toml` updated to register the renamed function.

## 3. New `/ops` route — Incident Command Center

Protected page `src/pages/OpsConsole.tsx` with three tabs (shadcn `Tabs`).

### Tab A — Unified Timeline
Single chronological feed merging:
- Aikido findings (from `security_findings`)
- Sentry issues (new `fetch-sentry-issues` edge function → Sentry REST `/api/0/organizations/{org}/issues/`)

Each row: source badge, severity color, title, timestamp, "Open in origin tool" link. Filters: source, severity, status, time range. Auto-refreshes every 30s.

### Tab B — Auto-Remediation Bridge
New table `ops_remediation_rules` (id, user_id, name, trigger_source enum[sentry|aikido], trigger_severity, trigger_match text, action enum[email|webhook], action_target text, enabled, last_fired_at). RLS: owner-only. Companion log table `ops_remediation_runs`.

UI: rule builder — "When Sentry issue matches `level:error` → send email to `ops@…`" or "POST to webhook URL with full payload". Cron edge function `ops-rule-dispatcher` (every 2 min) evaluates new findings/issues, fires actions via existing SendGrid or `fetch()` for webhooks, and writes to the log table.

### Tab C — Command Center (war-room)
- Counters: open Sentry issues (24h), Aikido criticals, MTTA, rules fired (24h).
- Reuses existing `Globe3D` with pulse markers for Sentry events with geo tags + heatmap of error rate.
- Severity sparkline (Recharts) per source over last 24h.
- Real-time via Supabase Realtime on `security_findings`; 30s polling for Sentry.

## 4. Edge functions (CORS + JWT verification in code)

- `ingest-aikido-findings` — renamed from Wiz; OAuth2 + issues export.
- `fetch-sentry-issues` — proxies Sentry REST, returns normalized `{id, title, level, lastSeen, permalink, count, project}`.
- `ops-rule-dispatcher` — cron; matches new findings against enabled rules, fires email/webhook, logs runs.

Delete `ingest-wiz-findings`.

## 5. Navigation
- Add "Ops" link to `Navigation.tsx` (auth-gated, lucide `Activity` icon).
- Add `/ops` route in `App.tsx` (lazy + `ProtectedRoute`).

## 6. Files touched

- new: `src/pages/OpsConsole.tsx`, `src/components/Ops/UnifiedTimeline.tsx`, `src/components/Ops/RemediationRules.tsx`, `src/components/Ops/CommandCenter.tsx`
- new edge functions listed above; delete `supabase/functions/ingest-wiz-findings/`
- edit: `src/App.tsx`, `src/components/Navigation.tsx`, `src/components/Settings/SecurityPanel.tsx`, `supabase/config.toml`
- migration: update existing Wiz rows `scanner='wiz'` → `scanner='aikido'`; create `ops_remediation_rules` + `ops_remediation_runs` with RLS + GRANTs; schedule cron for `ops-rule-dispatcher`.

Approve to start build.
