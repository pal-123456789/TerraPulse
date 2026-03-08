import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    const { to, subject, anomalyName, anomalyType, severity, description, latitude, longitude, recommendation, userId } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const severityColor = {
      low: "#22c55e",
      medium: "#eab308",
      high: "#f97316",
      extreme: "#ef4444",
      critical: "#ef4444",
    }[severity] || "#6b7280";

    const severityEmoji = {
      low: "🟢",
      medium: "🟡",
      high: "🟠",
      extreme: "🔴",
      critical: "🔴",
    }[severity] || "⚠️";

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
        <h2 style="color:${severityColor};margin:0 0 8px;">${severityEmoji} ${anomalyName || "Anomaly Detected"}</h2>
        <p style="color:#e2e8f0;margin:0;font-size:14px;">
          Severity: <strong style="color:${severityColor};text-transform:uppercase;">${severity || "unknown"}</strong>
        </p>
      </div>

      ${description ? `<div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="color:#cbd5e1;margin:0;font-size:14px;line-height:1.6;">${description}</p>
      </div>` : ""}

      ${latitude && longitude ? `<div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="color:#94a3b8;margin:0;font-size:13px;">📍 Location: ${Number(latitude).toFixed(2)}°, ${Number(longitude).toFixed(2)}°</p>
      </div>` : ""}

      ${recommendation ? `<div style="background:#00d9ff11;border:1px solid #00d9ff33;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="color:#00d9ff;margin:0 0 4px;font-size:13px;font-weight:bold;">💡 Recommendation</p>
        <p style="color:#cbd5e1;margin:0;font-size:14px;">${recommendation}</p>
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

    // Try sending with the domain-verified sender first, fall back to verified single sender
    const senders = [
      { email: "palghevariya.co23d2@scet.ac.in", name: "Team TerraGuardians" },
    ];

    let lastError = "";
    let sent = false;

    for (const sender of senders) {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: sender,
          subject,
          content: [{ type: "text/html", value: htmlContent }],
        }),
      });

      if (response.ok || response.status === 202) {
        console.log(`Email sent to ${to} via sender ${sender.email}`);
        sent = true;
        break;
      }

      const errorText = await response.text();
      lastError = `SendGrid ${response.status}: ${errorText}`;
      console.warn(`Sender ${sender.email} failed: ${lastError}. Trying next...`);
    }

    if (!sent) {
      throw new Error(`All senders failed. Last error: ${lastError}`);
    }

    // Log the email alert to database
    if (userId) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      
      await fetch(`${SUPABASE_URL}/rest/v1/email_alert_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          user_id: userId,
          anomaly_name: anomalyName || "Unknown Anomaly",
          anomaly_type: anomalyType || null,
          severity: severity || null,
          latitude: latitude || null,
          longitude: longitude || null,
          email_sent_to: to,
          subject: subject,
          status: "sent",
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
