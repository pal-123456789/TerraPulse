import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML-escape user-provided strings before interpolating into the email template.
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const truncate = (s: unknown, n: number) => {
  const str = String(s ?? "");
  return str.length > n ? str.slice(0, n) : str;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- Auth gate: require a valid Supabase JWT ---
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResult, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userResult?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const user = userResult.user;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      console.error("Email provider not configured (RESEND_API_KEY / LOVABLE_API_KEY)");
      return json({ error: "Email service unavailable. Please try again later." }, 503);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body" }, 400);
    }
    const {
      to,
      subject,
      anomalyName,
      anomalyType,
      severity,
      description,
      latitude,
      longitude,
      recommendation,
    } = body as Record<string, unknown>;

    if (!to || !subject) {
      return json({ error: "Missing required fields: to, subject" }, 400);
    }

    // --- Restrict recipient: only the caller's own email or their saved notification_email ---
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: pref } = await adminClient
      .from("notification_preferences")
      .select("notification_email")
      .eq("user_id", user.id)
      .maybeSingle();
    const allowedRecipients = new Set(
      [user.email, pref?.notification_email].filter(Boolean).map((e) => String(e).toLowerCase()),
    );
    const toStr = String(to).toLowerCase();
    if (!allowedRecipients.has(toStr)) {
      return json({ error: "Recipient not allowed" }, 403);
    }

    const sevKey = String(severity ?? "").toLowerCase();
    const severityColor = (
      { low: "#22c55e", medium: "#eab308", high: "#f97316", extreme: "#ef4444", critical: "#ef4444" } as Record<string, string>
    )[sevKey] || "#6b7280";
    const severityEmoji = (
      { low: "🟢", medium: "🟡", high: "🟠", extreme: "🔴", critical: "🔴" } as Record<string, string>
    )[sevKey] || "⚠️";

    // Safe versions (escaped + length-capped)
    const safeName = esc(truncate(anomalyName || "Anomaly Detected", 100));
    const safeSeverity = esc(truncate(sevKey || "unknown", 20));
    const safeDescription = description ? esc(truncate(description, 1000)) : "";
    const safeRecommendation = recommendation ? esc(truncate(recommendation, 1000)) : "";
    const safeSubject = truncate(String(subject), 150);
    const lat = Number(latitude);
    const lng = Number(longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:32px;border:1px solid #334155;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#00d9ff;margin:0;font-size:28px;">🌍 TerraGuardians</h1>
        <p style="color:#94a3b8;margin:8px 0 0;">Environmental Anomaly Alert</p>
      </div>
      <div style="background:${severityColor}22;border:1px solid ${severityColor}44;border-radius:12px;padding:20px;margin-bottom:20px;">
        <h2 style="color:${severityColor};margin:0 0 8px;">${severityEmoji} ${safeName}</h2>
        <p style="color:#e2e8f0;margin:0;font-size:14px;">
          Severity: <strong style="color:${severityColor};text-transform:uppercase;">${safeSeverity}</strong>
        </p>
      </div>
      ${safeDescription ? `<div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="color:#cbd5e1;margin:0;font-size:14px;line-height:1.6;">${safeDescription}</p>
      </div>` : ""}
      ${hasCoords ? `<div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="color:#94a3b8;margin:0;font-size:13px;">📍 Location: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°</p>
      </div>` : ""}
      ${safeRecommendation ? `<div style="background:#00d9ff11;border:1px solid #00d9ff33;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="color:#00d9ff;margin:0 0 4px;font-size:13px;font-weight:bold;">💡 Recommendation</p>
        <p style="color:#cbd5e1;margin:0;font-size:14px;">${safeRecommendation}</p>
      </div>` : ""}
      <div style="text-align:center;margin-top:24px;">
        <a href="https://www.terraguardians.us/dashboard" style="display:inline-block;background:#00d9ff;color:#0a0a1a;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
          View Dashboard →
        </a>
      </div>
      <p style="color:#64748b;font-size:11px;text-align:center;margin-top:24px;">
        You received this because you enabled email alerts on TerraGuardians.<br/>
        Manage preferences in <a href="https://www.terraguardians.us/settings" style="color:#00d9ff;">Settings</a>.
      </p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend (through Lovable connector gateway).
    // Falls back to Resend's shared onboarding domain until your terraguardians.us
    // domain is verified in Resend → Domains.
    const FROM_ADDRESS = Deno.env.get("RESEND_FROM_ADDRESS") ??
      "TerraGuardians Alerts <onboarding@resend.dev>";

    let sent = false;
    const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject: safeSubject,
        html: htmlContent,
        reply_to: "noreply@terraguardians.us",
      }),
    });

    if (response.ok) {
      console.log(`Anomaly email sent to ${to} via Resend`);
      sent = true;
    } else {
      const errorText = await response.text().catch(() => "");
      console.error(`Resend anomaly email failed (${response.status}): ${errorText}`);
    }

    if (!sent) {
      return json({ error: "Unable to deliver email at this time. Please try again later." }, 502);
    }

    // Log the email alert to database (server-side, with service role)
    await adminClient.from("email_alert_logs").insert({
      user_id: user.id,
      anomaly_name: String(anomalyName || "Unknown Anomaly").slice(0, 200),
      anomaly_type: anomalyType ? String(anomalyType).slice(0, 80) : null,
      severity: sevKey || null,
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lng : null,
      email_sent_to: toStr,
      subject: safeSubject,
      status: "sent",
    });

    return json({ success: true });
  } catch (error) {
    // Never leak internal details to the caller.
    console.error("send-anomaly-email error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
