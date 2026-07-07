// Ingest Aikido scan findings via Aikido REST API (OAuth2 client-credentials)
// and upsert into public.security_findings + public.security_memory.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AIKIDO_CLIENT_ID = Deno.env.get("AIKIDO_CLIENT_ID");
const AIKIDO_CLIENT_SECRET = Deno.env.get("AIKIDO_CLIENT_SECRET");
const AIKIDO_BASE = "https://app.aikido.dev";

type Severity = "critical" | "high" | "medium" | "low" | "info";

function normalizeSeverity(raw: unknown): Severity {
  const s = String(raw ?? "").toLowerCase();
  if (s.startsWith("crit")) return "critical";
  if (s.startsWith("high")) return "high";
  if (s.startsWith("med")) return "medium";
  if (s.startsWith("low")) return "low";
  return "info";
}

async function safeJson(res: Response): Promise<any | null> {
  const text = await res.text();
  if (!text) return null;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("json") && text.trimStart().startsWith("<")) {
    console.error("Aikido returned non-JSON response", res.status, text.slice(0, 200));
    return null;
  }
  try { return JSON.parse(text); } catch {
    console.error("Aikido JSON parse failed", text.slice(0, 200));
    return null;
  }
}

async function getAikidoToken(): Promise<string | null> {
  if (!AIKIDO_CLIENT_ID || !AIKIDO_CLIENT_SECRET) return null;
  const basic = btoa(`${AIKIDO_CLIENT_ID}:${AIKIDO_CLIENT_SECRET}`);
  const res = await fetch(`${AIKIDO_BASE}/api/oauth/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    console.error("Aikido token error", res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const j = await safeJson(res);
  return j?.access_token ?? null;
}

async function fetchAikidoIssues(): Promise<any[]> {
  const token = await getAikidoToken();
  if (!token) return [];
  const all: any[] = [];
  let page = 0;
  while (page < 10) {
    const res = await fetch(
      `${AIKIDO_BASE}/api/public/v1/open-issues/export?page=${page}&per_page=100&format=json`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    );
    if (!res.ok) {
      console.error("Aikido issues fetch error", res.status, (await res.text()).slice(0, 200));
      break;
    }
    const data = await safeJson(res);
    if (!data) break;
    const arr: any[] = Array.isArray(data) ? data : (data?.issues ?? data?.data ?? []);
    if (!arr.length) break;
    all.push(...arr);
    if (arr.length < 100) break;
    page++;
  }
  return all;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Cron-only endpoint — reject anonymous invocations that could burn Aikido
  // API quota or spam the security_findings table.
  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const startedAt = new Date().toISOString();
  const run = await supabase
    .from("security_ingest_runs")
    .insert({ scanner: "aikido", status: "running", started_at: startedAt })
    .select()
    .single();
  const runId = run.data?.id;

  try {
    const raw = await fetchAikidoIssues();
    let imported = 0;
    let memoryAdded = 0;

    if (raw.length > 0) {
      const rows = raw.map((i: any) => {
        const severity = normalizeSeverity(i.severity ?? i.severity_score ?? i.priority);
        const remediation = i.fix ?? i.remediation ?? i.advise ?? null;
        return {
          scanner: "aikido",
          external_id: String(i.id ?? i.issue_id ?? crypto.randomUUID()),
          title: String(i.title ?? i.rule ?? i.attack_surface ?? "Aikido finding").slice(0, 500),
          description: i.description ?? i.summary ?? null,
          severity,
          connector: i.type ?? i.scanner ?? "aikido",
          resource: i.affected_package ?? i.repository ?? i.file ?? null,
          remediation,
          fixable: Boolean(i.fix_available ?? remediation),
          metadata: i,
          last_seen_at: new Date().toISOString(),
          status: "open",
        };
      });

      const { error: upsertErr, count } = await supabase
        .from("security_findings")
        .upsert(rows, { onConflict: "scanner,external_id", count: "exact" });
      if (upsertErr) throw upsertErr;
      imported = count ?? rows.length;

      const actionable = rows.filter(
        (f) => f.fixable && (f.severity === "critical" || f.severity === "high" || f.severity === "medium"),
      );
      if (actionable.length) {
        const memRows = actionable.map((f) => ({
          source: "aikido",
          external_id: f.external_id,
          title: f.title.slice(0, 300),
          notes: f.remediation ?? f.description ?? null,
          severity: f.severity,
          fixable: true,
          is_resolved: false,
          metadata: { connector: f.connector, resource: f.resource },
        }));
        const { error: memErr, count: memCount } = await supabase
          .from("security_memory")
          .upsert(memRows, { onConflict: "source,external_id", count: "exact" });
        if (memErr) throw memErr;
        memoryAdded = memCount ?? memRows.length;
      }
    }

    if (runId) {
      await supabase.from("security_ingest_runs").update({
        status: AIKIDO_CLIENT_ID ? (raw.length ? "success" : "no_findings") : "no_credentials",
        findings_imported: imported,
        memory_items_added: memoryAdded,
        finished_at: new Date().toISOString(),
      }).eq("id", runId);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        imported,
        memoryAdded,
        configured: Boolean(AIKIDO_CLIENT_ID && AIKIDO_CLIENT_SECRET),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Aikido ingest failure", err);
    if (runId) {
      await supabase.from("security_ingest_runs").update({
        status: "error",
        error: String(err),
        finished_at: new Date().toISOString(),
      }).eq("id", runId);
    }
    return new Response(JSON.stringify({
      ok: false,
      imported: 0,
      memoryAdded: 0,
      configured: Boolean(AIKIDO_CLIENT_ID && AIKIDO_CLIENT_SECRET),
      error: "Aikido sync failed — check credentials or API access.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
