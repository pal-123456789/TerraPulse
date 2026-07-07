// Evaluates ops_remediation_rules against new findings/issues and fires
// email or webhook actions. Designed to be called on a schedule (every ~2 min).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENTRY_AUTH_TOKEN = Deno.env.get("SENTRY_AUTH_TOKEN");
const SENTRY_ORG_SLUG = Deno.env.get("SENTRY_ORG_SLUG");

const SEV_RANK: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

function matches(rule: any, finding: { severity: string; title: string }) {
  if (rule.trigger_severity !== "any") {
    const need = SEV_RANK[rule.trigger_severity] ?? 0;
    const got = SEV_RANK[finding.severity] ?? 0;
    if (got < need) return false;
  }
  if (rule.trigger_match && rule.trigger_match.trim()) {
    const m = rule.trigger_match.toLowerCase();
    if (!finding.title.toLowerCase().includes(m)) return false;
  }
  return true;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY not set");
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "alerts@terrapulse.lovable.app", name: "TerraPulse Ops" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
  if (!res.ok) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
}

// SSRF protection: only allow https, resolve the host, and reject any
// destination that maps to a private/loopback/link-local range.
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.split("::ffff:")[1];
    return isPrivateIPv4(v4);
  }
  return false;
}

async function assertPublicWebhookUrl(raw: string): Promise<URL> {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Invalid webhook URL"); }
  if (url.protocol !== "https:") throw new Error("Webhook URL must use https://");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const bannedHosts = new Set([
    "localhost",
    "ip6-localhost",
    "ip6-loopback",
    "metadata.google.internal",
  ]);
  if (bannedHosts.has(host.toLowerCase())) throw new Error("Webhook host is not allowed");
  if (host.endsWith(".internal") || host.endsWith(".local")) throw new Error("Webhook host is not allowed");

  // Literal IPs
  const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isIPv6 = host.includes(":");
  if (isIPv4 && isPrivateIPv4(host)) throw new Error("Webhook targets a private IP");
  if (isIPv6 && isPrivateIPv6(host)) throw new Error("Webhook targets a private IP");

  // DNS resolve — Deno.resolveDns is available on Supabase edge runtime
  if (!isIPv4 && !isIPv6) {
    let addresses: string[] = [];
    try {
      const [a, aaaa] = await Promise.allSettled([
        Deno.resolveDns(host, "A"),
        Deno.resolveDns(host, "AAAA"),
      ]);
      if (a.status === "fulfilled") addresses.push(...a.value);
      if (aaaa.status === "fulfilled") addresses.push(...aaaa.value);
    } catch { /* resolution failure -> treat as invalid */ }
    if (!addresses.length) throw new Error("Webhook host could not be resolved");
    for (const addr of addresses) {
      const bad = addr.includes(":") ? isPrivateIPv6(addr) : isPrivateIPv4(addr);
      if (bad) throw new Error("Webhook resolves to a private/internal address");
    }
  }
  return url;
}

async function postWebhook(url: string, payload: unknown) {
  const safeUrl = await assertPublicWebhookUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(safeUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "error", // block redirects to internal targets
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Webhook ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}


async function fetchRecentSentry() {
  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG_SLUG) return [];
  const res = await fetch(
    `https://sentry.io/api/0/organizations/${SENTRY_ORG_SLUG}/issues/?statsPeriod=1h&query=is:unresolved&limit=25`,
    { headers: { Authorization: `Bearer ${SENTRY_AUTH_TOKEN}` } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((i: any) => ({
    id: String(i.id),
    title: i.title ?? "Sentry issue",
    severity: i.level === "fatal" ? "critical" : i.level === "error" ? "high" : "medium",
    permalink: i.permalink,
    lastSeen: i.lastSeen,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Cron-only endpoint — reject anonymous callers so this can't be used to
  // spam SendGrid or replay webhooks.
  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);


  try {
    const { data: rules } = await supabase
      .from("ops_remediation_rules")
      .select("*")
      .eq("enabled", true);
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ ok: true, evaluated: 0, fired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull recent Aikido findings (last 10 minutes)
    const sinceIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: aikidoRows } = await supabase
      .from("security_findings")
      .select("id,external_id,title,severity,status,last_seen_at")
      .eq("scanner", "aikido")
      .gte("last_seen_at", sinceIso)
      .limit(100);

    const sentryIssues = await fetchRecentSentry();

    let fired = 0;
    for (const rule of rules) {
      const pool = rule.trigger_source === "sentry" ? sentryIssues : (aikidoRows ?? []);
      for (const f of pool) {
        if (!matches(rule, f as any)) continue;
        const findingRef = String((f as any).id ?? (f as any).external_id);
        // de-dupe per rule+finding
        const { data: existing } = await supabase
          .from("ops_remediation_runs")
          .select("id")
          .eq("rule_id", rule.id)
          .eq("finding_ref", findingRef)
          .limit(1);
        if (existing && existing.length) continue;

        let status = "success";
        let error: string | null = null;
        try {
          const subject = `[${rule.trigger_source.toUpperCase()}] ${(f as any).title}`;
          const html = `<h3>${subject}</h3><pre>${JSON.stringify(f, null, 2)}</pre>`;
          if (rule.action === "email") {
            await sendEmail(rule.action_target, subject, html);
          } else {
            await postWebhook(rule.action_target, { rule: rule.name, source: rule.trigger_source, finding: f });
          }
        } catch (e) {
          status = "error";
          error = String(e);
        }

        await supabase.from("ops_remediation_runs").insert({
          user_id: rule.user_id,
          rule_id: rule.id,
          source: rule.trigger_source,
          finding_ref: findingRef,
          payload: f as any,
          status,
          error,
        });
        await supabase
          .from("ops_remediation_rules")
          .update({ last_fired_at: new Date().toISOString() })
          .eq("id", rule.id);
        fired++;
      }
    }

    return new Response(JSON.stringify({ ok: true, fired }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ops-rule-dispatcher", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
