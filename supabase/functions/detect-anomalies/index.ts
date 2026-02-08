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
    // RATE LIMITING CHECK (stricter for AI calls)
    // ==========================================
    const { data: rateLimitResult } = await supabaseClient.rpc("check_rate_limit", {
      p_user_id: userId,
      p_endpoint: "detect-anomalies",
      p_max_requests: 10,
      p_window_minutes: 60
    });

    if (rateLimitResult?.exceeded) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Try again later.", 
          remaining: rateLimitResult.remaining,
          limit: rateLimitResult.limit 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const { latitude, longitude, weatherData, historicalData, satelliteData, airQualityData } = await req.json();

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

    console.log(`Running anomaly detection for user ${userId} at (${latitude}, ${longitude})`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare comprehensive AI analysis prompt
    const analysisPrompt = `You are an expert environmental scientist. Analyze the following environmental data and detect anomalies.

## LOCATION DATA
- Coordinates: ${latitude}°, ${longitude}°
- Region Type: ${getRegionType(latitude, longitude)}

## CURRENT WEATHER CONDITIONS
- Temperature: ${weatherData?.temperature ?? 'N/A'}°C
- Humidity: ${weatherData?.humidity ?? 'N/A'}%
- Atmospheric Pressure: ${weatherData?.pressure ?? 'N/A'} hPa
- Wind Speed: ${weatherData?.wind_speed ?? 'N/A'} m/s
- Weather Condition: ${weatherData?.weather_condition ?? 'N/A'}

## HISTORICAL DATA
- Avg Temperature: ${historicalData?.avg_temperature ?? 'N/A'}°C
- Avg Humidity: ${historicalData?.avg_humidity ?? 'N/A'}%
- Temperature Deviation: ${historicalData?.temp_deviation ?? 'N/A'}°C

## AIR QUALITY
- AQI: ${airQualityData?.aqi ?? 'N/A'}
- PM2.5: ${airQualityData?.pm25 ?? 'N/A'} µg/m³

## SATELLITE DATA
- Surface Temperature: ${satelliteData?.surface_temp ?? 'N/A'}°C
- NDVI: ${satelliteData?.ndvi ?? 'N/A'}

Provide analysis in JSON format:
{
  "hasAnomaly": boolean,
  "severity": "low" | "medium" | "high" | "extreme",
  "anomalyType": string,
  "confidence": number (0-100),
  "description": string,
  "affectedRadius": number,
  "potentialCauses": string[],
  "recommendation": string,
  "riskFactors": {
    "immediateRisk": boolean,
    "healthImpact": "none" | "low" | "moderate" | "high" | "severe",
    "environmentalImpact": "none" | "low" | "moderate" | "high" | "severe"
  },
  "forecastTrend": "improving" | "stable" | "worsening" | "uncertain"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert environmental scientist. Analyze data precisely and respond only with valid JSON.",
          },
          { role: "user", content: analysisPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      hasAnomaly: false,
      severity: "low",
      anomalyType: "none",
      confidence: 50,
      description: "Unable to parse analysis",
      recommendation: "Manual review recommended"
    };

    // Store anomaly if detected with high confidence
    if (analysis.hasAnomaly && analysis.confidence >= 60) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await serviceClient.from("anomalies").insert({
        name: formatAnomalyName(analysis.anomalyType),
        description: analysis.description,
        latitude: latitude,
        longitude: longitude,
        anomaly_type: analysis.anomalyType,
        severity: analysis.severity,
        status: analysis.riskFactors?.immediateRisk ? "active" : "monitoring",
        metadata: { 
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
          affectedRadius: analysis.affectedRadius,
          potentialCauses: analysis.potentialCauses,
          riskFactors: analysis.riskFactors,
          forecastTrend: analysis.forecastTrend,
          detectedBy: userId
        },
      });
    }

    console.log(`Anomaly detection completed for user ${userId}`);

    return new Response(JSON.stringify({
      ...analysis,
      rateLimit: {
        remaining: rateLimitResult?.remaining ?? "unknown",
        limit: rateLimitResult?.limit ?? 10
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in detect-anomalies:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getRegionType(lat: number, lon: number): string {
  const absLat = Math.abs(lat);
  if (absLat > 66.5) return "Polar";
  if (absLat > 55) return "Subarctic/Subantarctic";
  if (absLat > 35) return "Temperate";
  if (absLat > 23.5) return "Subtropical";
  return "Tropical";
}

function formatAnomalyName(type: string): string {
  const nameMap: Record<string, string> = {
    temperature_spike: "Temperature Anomaly Alert",
    pressure_drop: "Atmospheric Pressure Warning",
    air_quality_hazard: "Air Quality Hazard",
    drought_indicator: "Drought Conditions",
    flood_risk: "Flooding Risk",
    storm_formation: "Storm Formation Detected",
    wildfire_risk: "Wildfire Risk Alert",
  };
  return nameMap[type] || type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
