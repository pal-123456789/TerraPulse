// Supabase Auth "Send Email" HTTP hook — delivers all auth emails
// (signup verification, magic link, password recovery, email change,
// invite, reauthentication) via SendGrid instead of Supabase's SMTP.
//
// Setup (one-time, in Supabase Dashboard):
//   1. Authentication → Hooks → "Send Email hook" → Enable → HTTP
//   2. URL: https://<project-ref>.supabase.co/functions/v1/auth-email-sendgrid
//   3. Copy the generated secret and save it here as SEND_EMAIL_HOOK_SECRET
//   4. Turn OFF custom SMTP in Auth → SMTP (or leave the broken Gmail one;
//      once the hook is enabled Supabase routes through it instead).
//
// Requires secrets: SENDGRID_API_KEY, SEND_EMAIL_HOOK_SECRET
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

type AuthAction =
  | "signup"
  | "login"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email_change_current"
  | "email_change_new"
  | "reauthentication";

interface HookPayload {
  user: { email: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: AuthAction;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

function buildConfirmationUrl(p: HookPayload): string {
  const { site_url, token_hash, email_action_type, redirect_to } = p.email_data;
  const base = (site_url || "https://www.terraguardians.us").replace(/\/$/, "");
  const params = new URLSearchParams({
    token_hash,
    type: email_action_type,
    redirect_to: redirect_to || `${base}/`,
  });
  return `${base}/auth/confirm?${params.toString()}`;
}

function subjectFor(action: AuthAction): string {
  switch (action) {
    case "signup":
      return "Confirm your TerraGuardians account";
    case "recovery":
      return "Reset your TerraGuardians password";
    case "magiclink":
      return "Your TerraGuardians magic sign-in link";
    case "invite":
      return "You've been invited to TerraGuardians";
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return "Confirm your new TerraGuardians email";
    case "reauthentication":
      return "TerraGuardians verification code";
    default:
      return "TerraGuardians notification";
  }
}

function bodyFor(action: AuthAction, url: string, token: string): { heading: string; intro: string; cta: string; footer: string } {
  switch (action) {
    case "signup":
      return {
        heading: "Verify your email",
        intro: "Welcome to TerraGuardians. Confirm your email to activate account monitoring, alerts, and dashboard access.",
        cta: "Verify email",
        footer: "If you didn't create an account, you can safely ignore this email.",
      };
    case "recovery":
      return {
        heading: "Reset your password",
        intro: "We received a request to reset your password. Click the button below to choose a new one.",
        cta: "Reset password",
        footer: "This link expires in 1 hour. If you didn't request this, ignore this email.",
      };
    case "magiclink":
      return {
        heading: "Sign in to TerraGuardians",
        intro: "Click the button below to sign in. No password needed.",
        cta: "Sign in",
        footer: "This link expires in 1 hour.",
      };
    case "invite":
      return {
        heading: "You're invited",
        intro: "An admin invited you to join TerraGuardians. Accept the invite to set up your account.",
        cta: "Accept invite",
        footer: "If this wasn't expected, ignore this email.",
      };
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return {
        heading: "Confirm email change",
        intro: "Confirm your new email address to complete the change on your TerraGuardians account.",
        cta: "Confirm new email",
        footer: "If you didn't request this, contact support immediately.",
      };
    case "reauthentication":
      return {
        heading: "Your verification code",
        intro: `Enter this 6-digit code to continue: <div style="font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;color:#00d9ff;margin:24px 0;">${esc(token)}</div>`,
        cta: "",
        footer: "This code expires in 10 minutes.",
      };
    default:
      return { heading: "Notification", intro: "", cta: "Open TerraGuardians", footer: "" };
  }
}

function renderHtml(action: AuthAction, url: string, token: string): string {
  const { heading, intro, cta, footer } = bodyFor(action, url, token);
  const button = cta
    ? `<div style="text-align:center;margin:32px 0;">
         <a href="${esc(url)}" style="display:inline-block;background:#00d9ff;color:#0a0a1a;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">${esc(cta)} →</a>
       </div>
       <p style="color:#64748b;font-size:12px;text-align:center;word-break:break-all;">
         Or copy this link: <a href="${esc(url)}" style="color:#00d9ff;">${esc(url)}</a>
       </p>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:32px;border:1px solid #334155;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#00d9ff;margin:0;font-size:28px;">🌍 TerraGuardians</h1>
        <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">Environmental Intelligence Platform</p>
      </div>
      <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:22px;">${esc(heading)}</h2>
      <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 8px;">${intro}</p>
      ${button}
      <p style="color:#64748b;font-size:12px;text-align:center;margin-top:24px;">${esc(footer)}</p>
    </div>
    <p style="color:#475569;font-size:11px;text-align:center;margin-top:16px;">
      © TerraGuardians · <a href="https://www.terraguardians.us" style="color:#64748b;">terraguardians.us</a>
    </p>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!HOOK_SECRET) throw new Error("SEND_EMAIL_HOOK_SECRET not configured");

    const payloadRaw = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature (Standard Webhooks / Supabase Auth hook format).
    // Supabase supplies the secret as v1,whsec_... — strip the v1, prefix.
    const secret = HOOK_SECRET.replace(/^v1,/, "");
    const wh = new Webhook(secret);
    const verified = wh.verify(payloadRaw, headers) as HookPayload;

    const { user, email_data } = verified;
    const action = email_data.email_action_type;
    const url = buildConfirmationUrl(verified);
    const html = renderHtml(action, url, email_data.token);
    const subject = subjectFor(action);
    const to = action === "email_change_new" && user.new_email ? user.new_email : user.email;

    // If your terraguardians.us domain is not yet verified in Resend, this
    // sender falls back to Resend's shared onboarding domain so mail still
    // delivers. Verify the domain in Resend → Domains to send from your own.
    const FROM_ADDRESS = Deno.env.get("RESEND_FROM_ADDRESS") ??
      "TerraGuardians <onboarding@resend.dev>";

    const sendRes = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
        reply_to: "noreply@terraguardians.us",
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text().catch(() => "");
      console.error(`Resend auth email failed (${sendRes.status}): ${errText}`);
      // Return 200 so Supabase doesn't retry-storm; log the failure.
      return new Response(JSON.stringify({ delivered: false, status: sendRes.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Auth email sent: action=${action} to=${to}`);
    return new Response(JSON.stringify({ delivered: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("auth-email-sendgrid error:", err);
    // Supabase expects { error: { http_code, message } } to surface a controlled failure.
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: (err as Error).message } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
