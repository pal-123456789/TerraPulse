// Anomaly Response Hub — fans out a critical anomaly to:
//   1. Google Maps reverse geocode (enrich location)
//   2. ElevenLabs TTS briefing (returns base64 MP3)
//   3. Twilio SMS to user's saved number
//   4. Microsoft Teams channel message
//   5. Microsoft Excel row append (incident log)
// All channels are best-effort and reported individually.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const GATEWAY = "https://connector-gateway.lovable.dev";

async function reverseGeocode(lat: number, lng: number) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const conn = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!key || !conn) return null;
  try {
    const r = await fetch(
      `${GATEWAY}/google_maps/maps/api/geocode/json?latlng=${lat},${lng}`,
      { headers: { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": conn } },
    );
    const d = await r.json();
    return d?.results?.[0]?.formatted_address ?? null;
  } catch {
    return null;
  }
}

async function elevenlabsTTS(text: string, voiceId: string) {
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) return null;
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return btoa(bin);
  } catch {
    return null;
  }
}

async function sendSMS(to: string, from: string, body: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const conn = Deno.env.get("TWILIO_API_KEY");
  if (!key || !conn) return { ok: false, error: "Twilio not configured" };
  try {
    const r = await fetch(`${GATEWAY}/twilio/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "X-Connection-Api-Key": conn,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 1500) }),
    });
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d?.message ?? `HTTP ${r.status}` };
    return { ok: true, sid: d.sid };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function postTeamsMessage(teamId: string, channelId: string, html: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const conn = Deno.env.get("MICROSOFT_TEAMS_API_KEY");
  if (!key || !conn) return { ok: false, error: "Teams not configured" };
  try {
    const r = await fetch(
      `${GATEWAY}/microsoft_teams/teams/${teamId}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "X-Connection-Api-Key": conn,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: { contentType: "html", content: html } }),
      },
    );
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d?.error?.message ?? `HTTP ${r.status}` };
    return { ok: true, id: d.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function appendExcelRow(itemId: string, worksheet: string, row: string[]) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const conn = Deno.env.get("MICROSOFT_EXCEL_API_KEY");
  if (!key || !conn) return { ok: false, error: "Excel not configured" };
  try {
    // Find next empty row by reading usedRange row count, then patch.
    const u = await fetch(
      `${GATEWAY}/microsoft_excel/me/drive/items/${itemId}/workbook/worksheets/${worksheet}/usedRange?$select=rowCount`,
      { headers: { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": conn } },
    );
    const ud = await u.json();
    const nextRow = (ud?.rowCount ?? 0) + 1;
    const endCol = String.fromCharCode(64 + row.length);
    const addr = `A${nextRow}:${endCol}${nextRow}`;
    const r = await fetch(
      `${GATEWAY}/microsoft_excel/me/drive/items/${itemId}/workbook/worksheets/${worksheet}/range(address='${addr}')`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${key}`,
          "X-Connection-Api-Key": conn,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [row] }),
      },
    );
    const d = await r.json();
    if (!r.ok) return { ok: false, error: d?.error?.message ?? `HTTP ${r.status}` };
    return { ok: true, address: addr };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims, error: cErr } = await supabase.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (cErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;

  let body: { anomaly_id?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!body.anomaly_id || typeof body.anomaly_id !== "string")
    return json({ error: "anomaly_id required" }, 400);

  // Rate limit: 10 dispatches / hour / user
  const { data: rl } = await supabase.rpc("check_rate_limit", {
    p_user_id: userId,
    p_endpoint: "anomaly-response-hub",
    p_max_requests: 10,
    p_window_minutes: 60,
  });
  if (rl?.exceeded) return json({ error: "Rate limit exceeded" }, 429);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const [{ data: anomaly }, { data: cfg }] = await Promise.all([
    admin.from("anomalies").select("*").eq("id", body.anomaly_id).maybeSingle(),
    admin.from("response_hub_config").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (!anomaly) return json({ error: "Anomaly not found" }, 404);
  if (!cfg || !cfg.enabled) return json({ error: "Response Hub not configured" }, 400);

  // Create run row
  const { data: run } = await admin
    .from("response_hub_runs")
    .insert({ user_id: userId, anomaly_id: anomaly.id, status: "running" })
    .select()
    .single();

  const place = await reverseGeocode(Number(anomaly.latitude), Number(anomaly.longitude));
  const summary =
    `Critical alert: ${anomaly.name}. Type: ${anomaly.anomaly_type}. ` +
    `Severity: ${anomaly.severity}. Location: ${place ?? `${anomaly.latitude}, ${anomaly.longitude}`}. ` +
    (body.note ?? anomaly.description ?? "Immediate triage recommended.");

  const audioBase64 = await elevenlabsTTS(summary, cfg.voice_id ?? "EXAVITQu4vr4xnSDxMaL");

  const mapsLink = `https://maps.google.com/?q=${anomaly.latitude},${anomaly.longitude}`;
  const sms = cfg.sms_phone && cfg.sms_from
    ? await sendSMS(cfg.sms_phone, cfg.sms_from, `${summary}\n${mapsLink}`)
    : { ok: false, skipped: true };

  const teams = cfg.teams_team_id && cfg.teams_channel_id
    ? await postTeamsMessage(
        cfg.teams_team_id,
        cfg.teams_channel_id,
        `<h3>🚨 ${anomaly.name}</h3><p><b>Severity:</b> ${anomaly.severity}<br/>` +
          `<b>Type:</b> ${anomaly.anomaly_type}<br/>` +
          `<b>Location:</b> ${place ?? `${anomaly.latitude}, ${anomaly.longitude}`}</p>` +
          `<p>${summary}</p><p><a href="${mapsLink}">Open in Google Maps</a></p>`,
      )
    : { ok: false, skipped: true };

  const excel = cfg.excel_item_id
    ? await appendExcelRow(cfg.excel_item_id, cfg.excel_worksheet ?? "Sheet1", [
        new Date().toISOString(),
        anomaly.name,
        anomaly.anomaly_type,
        anomaly.severity,
        String(anomaly.latitude),
        String(anomaly.longitude),
        place ?? "",
        summary,
      ])
    : { ok: false, skipped: true };

  const channels = { sms, teams, excel, geocoded: !!place, voice: !!audioBase64 };
  const ok = (sms as any).ok || (teams as any).ok || (excel as any).ok;
  await admin
    .from("response_hub_runs")
    .update({
      status: ok ? "complete" : "failed",
      channels,
      summary,
      place_name: place,
    })
    .eq("id", run!.id);

  return json({
    ok: true,
    run_id: run!.id,
    summary,
    place,
    channels,
    audio_base64: audioBase64,
  });
});
