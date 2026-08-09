// Supabase Auth "Send Email" HTTP hook — delivers all auth emails
// (signup verification, magic link, password recovery, email change,
// invite, reauthentication) through Resend instead of Supabase's SMTP.
//
// Setup (one-time, in Supabase Dashboard):
//   1. Authentication → Hooks → "Send Email hook" → Enable → HTTP
//   2. URL: https://<project-ref>.supabase.co/functions/v1/auth-email-sendgrid
//   3. Copy the generated secret and save it here as SEND_EMAIL_HOOK_SECRET
//   4. Turn OFF custom SMTP in Auth → SMTP (or leave the broken Gmail one;
//      once the hook is enabled Supabase routes through it instead).
//
// Requires secrets: RESEND_API_KEY, LOVABLE_API_KEY, SEND_EMAIL_HOOK_SECRET
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

const APP_URL = (Deno.env.get("APP_SITE_URL") ?? "https://www.terraguardians.us").replace(/\/$/, "");

function buildConfirmationUrl(p: HookPayload): string {
  const { site_url, token_hash, email_action_type, redirect_to } = p.email_data;
  // Never point the link at the Supabase API host — that returns
  // "No API key found in request". Always use the app's own domain.
  const candidate = (site_url || "").replace(/\/$/, "");
  const base = candidate && !/supabase\.(co|in)$/i.test(new URL(candidate || APP_URL).hostname)
    ? candidate
    : APP_URL;
  // Password recovery must always land on the reset-password screen.
  const fallbackRedirect =
    email_action_type === "recovery" ? "/reset-password" : redirect_to || `${base}/`;
  const params = new URLSearchParams({
    token_hash,
    type: email_action_type,
    redirect_to: email_action_type === "recovery" ? "/reset-password" : fallbackRedirect,
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

// All auth emails are code-based: the user copies a 6-digit code into the app.
function bodyFor(action: AuthAction): { heading: string; intro: string; footer: string } {
  switch (action) {
    case "signup":
      return {
        heading: "Verify your email",
        intro: "Welcome to TerraGuardians. Enter this code in the app to activate your account.",
        footer: "This code expires in 1 hour. If you didn't create an account, ignore this email.",
      };
    case "recovery":
      return {
        heading: "Reset your password",
        intro: "Click the button below to choose a new password for your account.",
        footer: "This link expires in 1 hour. If you didn't request this, ignore this email.",
      };
    case "magiclink":
    case "login":
      return {
        heading: "Sign in to TerraGuardians",
        intro: "Enter this code in the app to sign in. No password needed.",
        footer: "This code expires in 1 hour.",
      };
    case "invite":
      return {
        heading: "You're invited",
        intro: "An admin invited you to join TerraGuardians. Enter this code in the app to accept.",
        footer: "If this wasn't expected, ignore this email.",
      };
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return {
        heading: "Confirm email change",
        intro: "Enter this code in the app to confirm your new email address.",
        footer: "If you didn't request this, contact support immediately.",
      };
    case "reauthentication":
      return {
        heading: "Your verification code",
        intro: "Enter this code to continue.",
        footer: "This code expires in 10 minutes.",
      };
    default:
      return { heading: "Verification code", intro: "Enter this code in the app to continue.", footer: "" };
  }
}

function renderHtml(action: AuthAction, url: string, token: string): string {
  const { heading, intro, footer } = bodyFor(action);
  const code = esc(token);
  const safeUrl = esc(url);
  // Password recovery uses a clickable link; every other flow uses a 6-digit code.
  const button = action === "recovery"
    ? `<div style="text-align:center;margin:28px 0;">
         <a href="${safeUrl}" style="display:inline-block;background:#00d9ff;color:#04121a;text-decoration:none;font-weight:bold;font-size:16px;border-radius:12px;padding:16px 34px;">Reset my password</a>
       </div>
       <p style="color:#64748b;font-size:12px;text-align:center;word-break:break-all;">If the button doesn't work, paste this link into your browser:<br><a href="${safeUrl}" style="color:#00d9ff;">${safeUrl}</a></p>`
    : `<div style="text-align:center;margin:28px 0;">
         <div style="display:inline-block;background:#0b1220;border:1px solid #00d9ff55;border-radius:12px;padding:18px 32px;">
           <span style="font-family:'Courier New',monospace;font-size:34px;font-weight:bold;letter-spacing:10px;color:#00d9ff;">${code}</span>
         </div>
       </div>
       <p style="color:#64748b;font-size:12px;text-align:center;">Copy this code and paste it into TerraGuardians. Never share it with anyone.</p>`;


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
