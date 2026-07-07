// Proxy Sentry REST API to return normalized issues for the Ops Console.
// Admin-only: validates JWT and requires the caller to have the 'admin' role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SENTRY_AUTH_TOKEN = Deno.env.get("SENTRY_AUTH_TOKEN");
const SENTRY_ORG_SLUG = Deno.env.get("SENTRY_ORG_SLUG");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Require an authenticated admin caller — Sentry issue data (titles,
  // culprits, project slugs, permalinks) can leak internal file paths and
  // unpatched-bug details to the public otherwise.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG_SLUG) {
    return new Response(JSON.stringify({ configured: false, issues: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  try {
    const url = new URL(req.url);
    const statsPeriod = url.searchParams.get("statsPeriod") ?? "24h";
    const query = url.searchParams.get("query") ?? "is:unresolved";
    const limit = url.searchParams.get("limit") ?? "50";

    const apiUrl = `https://sentry.io/api/0/organizations/${SENTRY_ORG_SLUG}/issues/?statsPeriod=${encodeURIComponent(statsPeriod)}&query=${encodeURIComponent(query)}&limit=${limit}`;

    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${SENTRY_AUTH_TOKEN}` },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Sentry API error", res.status, text);
      return new Response(JSON.stringify({ configured: true, error: text, issues: [] }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    const issues = (Array.isArray(data) ? data : []).map((i: any) => ({
      id: String(i.id),
      title: i.title ?? i.metadata?.title ?? "Sentry issue",
      level: i.level ?? "error",
      status: i.status,
      lastSeen: i.lastSeen,
      firstSeen: i.firstSeen,
      count: Number(i.count ?? 0),
      userCount: Number(i.userCount ?? 0),
      permalink: i.permalink,
      project: i.project?.slug ?? null,
      culprit: i.culprit ?? null,
    }));

    return new Response(JSON.stringify({ configured: true, issues }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-sentry-issues", err);
    return new Response(JSON.stringify({ configured: true, error: String(err), issues: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
