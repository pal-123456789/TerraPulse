import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ==========================================
    // AUTHENTICATION CHECK
    // ==========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !claimsData?.user) {
      console.error("Auth validation failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user!.id;
    console.log(`Authenticated user: ${userId}`);

    // ==========================================
    // RATE LIMITING CHECK
    // ==========================================
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: rateLimitResult, error: rateLimitError } = await serviceClient.rpc("check_rate_limit", {
      p_user_id: userId,
      p_endpoint: "predict-conditions",
      p_max_requests: 10,
      p_window_minutes: 60
    });

    if (rateLimitError) {
      console.error("Prediction rate-limit check failed:", rateLimitError.message);
      throw new Error("Unable to verify request limit");
    }

    if (rateLimitResult?.exceeded) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Try again later.", 
          remaining: rateLimitResult.remaining 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const { latitude, longitude, weatherData, historicalData } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude must be numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Running prediction for user ${userId} at (${latitude}, ${longitude})`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const predictionPrompt = `Based on the current and historical environmental data, predict conditions for the next 24-48 hours:

Current Conditions:
- Location: ${latitude}, ${longitude}
- Temperature: ${weatherData?.temperature ?? 'N/A'}°C
- Humidity: ${weatherData?.humidity ?? 'N/A'}%
- Pressure: ${weatherData?.pressure ?? 'N/A'} hPa
- Wind Speed: ${weatherData?.wind_speed ?? 'N/A'} m/s

Provide predictions in JSON format:
{
  "riskLevel": "low" | "medium" | "high" | "extreme",
  "predictionType": string,
  "confidence": number (0-100),
  "forecast": string,
  "expectedConditions": {
    "temperature": string,
    "precipitation": string,
    "wind": string
  },
  "warnings": string[]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert meteorologist. Analyze patterns and provide predictions. Respond only with valid JSON.",
          },
          { role: "user", content: predictionPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const predictionText = aiData.choices[0].message.content;
    
    const jsonMatch = predictionText.match(/\{[\s\S]*\}/);
    const prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      riskLevel: "low",
      predictionType: "general_forecast",
      confidence: 70,
      forecast: "Normal conditions expected",
      expectedConditions: {
        temperature: "Stable",
        precipitation: "Low chance",
        wind: "Calm"
      },
      warnings: []
    };

    // Store prediction
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 48);

    await serviceClient.from("predictions").insert({
      latitude: latitude,
      longitude: longitude,
      prediction_type: prediction.predictionType,
      risk_level: prediction.riskLevel,
      confidence: prediction.confidence,
      forecast_data: prediction,
      valid_until: validUntil.toISOString(),
    });

    // Every completed prediction is useful to the requesting user. Persist an
    // in-app notification, then apply their severity preference to email only.
    let notificationCreated = false;
    let emailSent = false;
    try {
      const normalizedRisk = String(prediction.riskLevel || "low").toLowerCase();
      const severity = normalizedRisk === "moderate" ? "medium" : normalizedRisk;
      const title = `🔮 ${normalizedRisk.toUpperCase()} risk forecast`;
      const message = prediction.forecast ||
        `A ${normalizedRisk} risk ${prediction.predictionType} is forecast at (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°).`;

      const { error: notifErr } = await serviceClient.from("notifications").insert({
        user_id: userId,
        title,
        message,
        type: "prediction",
      });
      if (notifErr) {
        console.error("Prediction notification insert failed:", notifErr.message);
      } else {
        notificationCreated = true;
        console.log(`Prediction in-app notification created for user ${userId}`);
      }

      const { data: prefs, error: prefsError } = await serviceClient
        .from("notification_preferences")
        .select("email_notifications_enabled, notification_email, min_severity")
        .eq("user_id", userId)
        .maybeSingle();
      if (prefsError) console.error("Prediction preferences lookup failed:", prefsError.message);

      const severityOrder = ["low", "medium", "high", "extreme", "critical"];
      const riskIdx = severityOrder.indexOf(severity);
      const minIdx = severityOrder.indexOf(prefs?.min_severity || "medium");
      if (prefs?.email_notifications_enabled && riskIdx >= Math.max(0, minIdx)) {
        const { data: userData } = await serviceClient.auth.admin.getUserById(userId);
        const userEmail = prefs.notification_email || userData?.user?.email;
        if (userEmail) {
          const emailRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-anomaly-email`, {
            method: "POST",
            headers: {
              apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
              "x-internal-secret": Deno.env.get("CRON_SECRET") ?? "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: userEmail,
              subject: `🔮 TerraGuardians Forecast: ${normalizedRisk.toUpperCase()} risk`,
              anomalyName: title,
              anomalyType: prediction.predictionType || "forecast",
              severity,
              description: message,
              latitude,
              longitude,
              recommendation: (prediction.warnings || []).join(" ") || "Monitor conditions closely.",
              userId,
            }),
          });
          if (emailRes.ok) {
            emailSent = true;
            console.log(`Prediction email sent for user ${userId}`);
          } else {
            console.error("Prediction email failed:", emailRes.status, await emailRes.text());
          }
        }
      }
    } catch (notifyError) {
      console.error("Prediction notification error (non-fatal):", notifyError);
    }

    console.log(`Prediction completed for user ${userId}`);


    return new Response(JSON.stringify({
      ...prediction,
      rateLimit: {
        remaining: rateLimitResult?.remaining ?? "unknown",
        limit: rateLimitResult?.limit ?? 10
      },
      delivery: { notificationCreated, emailSent }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in predict-conditions:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
