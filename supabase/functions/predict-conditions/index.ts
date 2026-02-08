import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);
    
    if (authError || !claimsData?.claims) {
      console.error("Auth validation failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    // ==========================================
    // RATE LIMITING CHECK
    // ==========================================
    const { data: rateLimitResult } = await supabaseClient.rpc("check_rate_limit", {
      p_user_id: userId,
      p_endpoint: "predict-conditions",
      p_max_requests: 10,
      p_window_minutes: 60
    });

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
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    console.log(`Prediction completed for user ${userId}`);

    return new Response(JSON.stringify({
      ...prediction,
      rateLimit: {
        remaining: rateLimitResult?.remaining ?? "unknown",
        limit: rateLimitResult?.limit ?? 10
      }
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
